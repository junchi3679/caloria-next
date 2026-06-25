import { useEffect, useRef, useState } from 'react'
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'
import { useGameStore } from '../../store/gameStore'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'

// 자세 판정: 스쿼트 — 무릎 각도 < 100°
function detectSquat(landmarks: { x: number; y: number; z: number }[]): boolean {
  const hip = landmarks[23], knee = landmarks[25], ankle = landmarks[27]
  if (!hip || !knee || !ankle) return false
  const v1 = { x: hip.x - knee.x, y: hip.y - knee.y }
  const v2 = { x: ankle.x - knee.x, y: ankle.y - knee.y }
  const dot = v1.x * v2.x + v1.y * v2.y
  const mag = Math.sqrt(v1.x ** 2 + v1.y ** 2) * Math.sqrt(v2.x ** 2 + v2.y ** 2)
  const angle = Math.acos(Math.min(dot / mag, 1)) * (180 / Math.PI)
  return angle < 100
}

// 자세 판정: 플랭크 — 어깨-엉덩이-발목이 일직선
function detectPlank(landmarks: { x: number; y: number; z: number }[]): boolean {
  const shoulder = landmarks[11], hip = landmarks[23], ankle = landmarks[27]
  if (!shoulder || !hip || !ankle) return false
  const dy1 = Math.abs(shoulder.y - hip.y)
  const dy2 = Math.abs(hip.y - ankle.y)
  return dy1 < 0.08 && dy2 < 0.08
}

// 자세 판정: 팔 들기 (점프/도약)
function detectJump(landmarks: { x: number; y: number; z: number }[]): boolean {
  const lWrist = landmarks[15], rWrist = landmarks[16]
  const lShoulder = landmarks[11], rShoulder = landmarks[12]
  if (!lWrist || !rWrist || !lShoulder || !rShoulder) return false
  return lWrist.y < lShoulder.y - 0.1 && rWrist.y < rShoulder.y - 0.1
}

export type DetectedPose = 'squat' | 'plank' | 'jump' | 'none'

interface Props {
  onPose?: (pose: DetectedPose) => void
  minimized?: boolean
}

export default function PoseCamera({ onPose, minimized = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)
  const addExp = useGameStore((s) => s.addExp)

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [currentPose, setCurrentPose] = useState<DetectedPose>('none')
  const lastPoseRef = useRef<DetectedPose>('none')
  const poseCountRef = useRef(0)

  useEffect(() => {
    let active = true
    let animId: number

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        })
        if (!active) return
        landmarkerRef.current = landmarker

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        if (!active) return
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('ready')
        runDetection()
      } catch {
        if (active) setStatus('error')
      }
    }

    function runDetection() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !landmarkerRef.current) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const draw = new DrawingUtils(ctx)

      function detect() {
        if (!active || !landmarkerRef.current) return
        const now = performance.now()
        const result = landmarkerRef.current.detectForVideo(video!, now)

        ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
        ctx!.drawImage(video!, 0, 0, canvas!.width, canvas!.height)

        if (result.landmarks.length > 0) {
          const lm = result.landmarks[0]
          draw.drawLandmarks(lm, { color: '#00d4ff', lineWidth: 2, radius: 3 })
          draw.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: 'rgba(0,212,255,0.5)', lineWidth: 1.5 })

          // 자세 판정
          let pose: DetectedPose = 'none'
          if (detectSquat(lm)) pose = 'squat'
          else if (detectPlank(lm)) pose = 'plank'
          else if (detectJump(lm)) pose = 'jump'

          // 자세 유지 카운트 (0.5초 = ~15프레임 이상 유지시 발동)
          if (pose !== 'none' && pose === lastPoseRef.current) {
            poseCountRef.current++
            if (poseCountRef.current === 15) {
              setCurrentPose(pose)
              onPose?.(pose)
              addExp(5)
            }
          } else {
            lastPoseRef.current = pose
            poseCountRef.current = 0
            if (pose === 'none') setCurrentPose('none')
          }
        }

        animId = requestAnimationFrame(detect)
      }
      detect()
    }

    init()
    return () => {
      active = false
      cancelAnimationFrame(animId)
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((t) => t.stop())
      }
    }
  }, [])

  const POSE_LABEL: Record<DetectedPose, string> = {
    squat: '스쿼트 감지!',
    plank: '플랭크 감지!',
    jump: '점프 감지!',
    none: '',
  }

  if (minimized) {
    return (
      <div className="relative" style={{ width: 160, height: 120 }}>
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline style={{ display: 'none' }} />
        <canvas ref={canvasRef} width={160} height={120} className="w-full h-full" style={{ transform: 'scaleX(-1)' }} />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center font-hud text-xs pulse" style={{ background: 'rgba(0,20,40,0.8)', color: 'rgba(0,212,255,0.6)' }}>
            AR INIT...
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center font-hud text-xs" style={{ background: 'rgba(20,0,0,0.8)', color: 'var(--sf-danger)' }}>
            CAM ERROR
          </div>
        )}
        {currentPose !== 'none' && (
          <div className="absolute bottom-1 left-1 right-1 text-center font-hud text-xs py-0.5" style={{ background: 'rgba(0,212,255,0.2)', color: 'var(--sf-primary)', fontSize: '0.6rem' }}>
            {POSE_LABEL[currentPose]}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline style={{ display: 'none' }} />
      <canvas ref={canvasRef} width={640} height={480} className="w-full h-full" style={{ transform: 'scaleX(-1)' }} />

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(2,11,24,0.9)' }}>
          <div className="font-hud text-sm text-glow pulse mb-2">AR SYSTEM INITIALIZING</div>
          <div className="text-xs" style={{ color: 'rgba(0,212,255,0.5)' }}>카메라 및 자세 인식 모델 로딩 중...</div>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(20,0,0,0.9)' }}>
          <div className="font-hud text-sm mb-2" style={{ color: 'var(--sf-danger)' }}>CAMERA ACCESS DENIED</div>
          <div className="text-xs" style={{ color: 'rgba(255,100,100,0.6)' }}>카메라 권한을 허용해주세요.</div>
        </div>
      )}
      {status === 'ready' && currentPose !== 'none' && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 font-hud text-sm px-4 py-2 fade-in-down"
          style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.5)', color: 'var(--sf-primary)' }}
        >
          ◈ {POSE_LABEL[currentPose]}  +5 EXP
        </div>
      )}
    </div>
  )
}
