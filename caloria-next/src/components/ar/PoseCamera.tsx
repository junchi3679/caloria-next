import { useEffect, useRef, useState } from 'react'
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'

type LM = { x: number; y: number; z: number }

// ── 자세 판정 ──────────────────────────────────────────────

function detectSquat(lm: LM[]): boolean {
  const hip = lm[23], knee = lm[25], ankle = lm[27]
  if (!hip || !knee || !ankle) return false
  const v1 = { x: hip.x - knee.x, y: hip.y - knee.y }
  const v2 = { x: ankle.x - knee.x, y: ankle.y - knee.y }
  const dot = v1.x * v2.x + v1.y * v2.y
  const mag = Math.sqrt(v1.x ** 2 + v1.y ** 2) * Math.sqrt(v2.x ** 2 + v2.y ** 2)
  const angle = Math.acos(Math.min(dot / mag, 1)) * (180 / Math.PI)
  return angle < 100
}

function detectPlank(lm: LM[]): boolean {
  const shoulder = lm[11], hip = lm[23], ankle = lm[27]
  if (!shoulder || !hip || !ankle) return false
  return Math.abs(shoulder.y - hip.y) < 0.08 && Math.abs(hip.y - ankle.y) < 0.08
}

function detectJump(lm: LM[]): boolean {
  const lWrist = lm[15], rWrist = lm[16], lShoulder = lm[11], rShoulder = lm[12]
  if (!lWrist || !rWrist || !lShoulder || !rShoulder) return false
  return lWrist.y < lShoulder.y - 0.1 && rWrist.y < rShoulder.y - 0.1
}

// ── 이동 감지 ──────────────────────────────────────────────

function detectMarching(kneeHistory: number[]): boolean {
  if (kneeHistory.length < 10) return false
  const min = Math.min(...kneeHistory)
  const max = Math.max(...kneeHistory)
  return max - min > 0.05
}

// 빠를수록 speed가 높아짐 (0~1): 최근 프레임의 무릎 변화량 합산
function calcMovementSpeed(kneeHistory: number[]): number {
  if (kneeHistory.length < 5) return 0
  const recent = kneeHistory.slice(-12)
  let totalChange = 0
  for (let i = 1; i < recent.length; i++) {
    totalChange += Math.abs(recent[i] - recent[i - 1])
  }
  // 느린 걸음 ~0.03, 빠른 걸음 ~0.12 → 0.10 기준으로 정규화
  return Math.min(totalChange / 0.10, 1.0)
}

function detectDirection(lm: LM[]): 'forward' | 'left' | 'right' {
  const lShoulder = lm[11], rShoulder = lm[12]
  if (!lShoulder || !rShoulder) return 'forward'
  const tilt = lShoulder.y - rShoulder.y
  if (tilt > 0.06) return 'left'
  if (tilt < -0.06) return 'right'
  return 'forward'
}

// ── 타입 ───────────────────────────────────────────────────

export type DetectedPose = 'squat' | 'plank' | 'jump' | 'none'
export type MoveDirection = 'forward' | 'left' | 'right'
export interface MovementState {
  moving: boolean
  direction: MoveDirection
  speed: number
}

interface Props {
  onPose?: (pose: DetectedPose) => void
  movementRef?: React.MutableRefObject<MovementState>
  minimized?: boolean
}

export default function PoseCamera({ onPose, movementRef, minimized = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [currentPose, setCurrentPose] = useState<DetectedPose>('none')
  const [moveState, setMoveState] = useState<MovementState>({ moving: false, direction: 'forward', speed: 0 })

  const lastPoseRef = useRef<DetectedPose>('none')
  const poseCountRef = useRef(0)
  const kneeHistoryRef = useRef<number[]>([])

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
        const result = landmarkerRef.current.detectForVideo(video!, performance.now())

        ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
        ctx!.drawImage(video!, 0, 0, canvas!.width, canvas!.height)

        if (result.landmarks.length > 0) {
          const lm = result.landmarks[0]
          draw.drawLandmarks(lm, { color: '#00d4ff', lineWidth: 2, radius: 3 })
          draw.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: 'rgba(0,212,255,0.5)', lineWidth: 1.5 })

          // ── 이동 감지 ──
          const lKneeY = lm[25]?.y ?? 0
          kneeHistoryRef.current.push(lKneeY)
          if (kneeHistoryRef.current.length > 20) kneeHistoryRef.current.shift()

          const moving = detectMarching(kneeHistoryRef.current)
          const direction = detectDirection(lm)
          const speed = moving ? calcMovementSpeed(kneeHistoryRef.current) : 0
          const ms: MovementState = { moving, direction, speed }

          if (movementRef) movementRef.current = ms
          setMoveState(ms)

          // 방향 표시선
          if (moving) {
            const arrowColor = direction === 'forward' ? '#00d4ff' : '#ff8844'
            ctx!.save()
            ctx!.strokeStyle = arrowColor
            ctx!.lineWidth = 3
            ctx!.globalAlpha = 0.7
            const cx = canvas!.width / 2
            const cy = canvas!.height / 2
            const offset = direction === 'left' ? -40 : direction === 'right' ? 40 : 0
            ctx!.beginPath()
            ctx!.moveTo(cx, cy)
            ctx!.lineTo(cx + offset, cy - 30)
            ctx!.stroke()
            ctx!.restore()
          }

          // ── 스킬 자세 감지 ──
          let pose: DetectedPose = 'none'
          if (detectSquat(lm)) pose = 'squat'
          else if (detectPlank(lm)) pose = 'plank'
          else if (detectJump(lm)) pose = 'jump'

          if (pose !== 'none' && pose === lastPoseRef.current) {
            poseCountRef.current++
            if (poseCountRef.current === 15) {
              setCurrentPose(pose)
              onPose?.(pose)
            }
          } else {
            lastPoseRef.current = pose
            poseCountRef.current = 0
            if (pose === 'none') setCurrentPose('none')
          }
        } else {
          if (movementRef) movementRef.current = { moving: false, direction: 'forward', speed: 0 }
          setMoveState({ moving: false, direction: 'forward', speed: 0 })
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
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const POSE_LABEL: Record<DetectedPose, string> = {
    squat: '스쿼트', plank: '플랭크', jump: '점프', none: '',
  }
  const DIR_LABEL: Record<MoveDirection, string> = {
    forward: '▲ 전진', left: '◀ 좌', right: '▶ 우',
  }

  if (minimized) {
    return (
      <div className="relative" style={{ width: 200, height: 150 }}>
        <video ref={videoRef} muted playsInline style={{ display: 'none' }} />
        <canvas ref={canvasRef} width={200} height={150} className="w-full h-full" style={{ transform: 'scaleX(-1)' }} />

        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center font-hud text-xs pulse"
            style={{ background: 'rgba(0,20,40,0.85)', color: 'rgba(0,212,255,0.6)' }}>
            AR INIT...
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center font-hud text-xs"
            style={{ background: 'rgba(20,0,0,0.85)', color: 'var(--sf-danger)' }}>
            CAM ERROR
          </div>
        )}
        {status === 'ready' && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-2 py-1"
            style={{ background: 'rgba(0,10,20,0.75)', borderTop: '1px solid rgba(0,212,255,0.15)' }}>
            <span className="font-hud" style={{ fontSize: '0.6rem', color: moveState.moving ? '#00d4ff' : 'rgba(0,212,255,0.3)' }}>
              {moveState.moving ? DIR_LABEL[moveState.direction] : '■ 정지'}
            </span>
            {moveState.moving && (
              <span className="font-hud" style={{ fontSize: '0.55rem', color: 'rgba(0,212,255,0.6)' }}>
                SPD {Math.round(moveState.speed * 100)}%
              </span>
            )}
            {currentPose !== 'none' && (
              <span className="font-hud" style={{ fontSize: '0.6rem', color: 'var(--sf-accent)' }}>
                {POSE_LABEL[currentPose]}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} muted playsInline style={{ display: 'none' }} />
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
    </div>
  )
}
