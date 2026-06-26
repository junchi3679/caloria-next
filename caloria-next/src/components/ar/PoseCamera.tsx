import { useEffect, useRef, useState } from 'react'
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'
import { useGameStore } from '../../store/gameStore'

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

// 제자리 걸음 감지: 무릎 y좌표 진폭이 일정 이상이면 걷는 중
function detectMarching(kneeHistory: number[]): boolean {
  if (kneeHistory.length < 10) return false
  const min = Math.min(...kneeHistory)
  const max = Math.max(...kneeHistory)
  return max - min > 0.05
}

// 방향 감지: 어깨 기울기로 좌/우/전방 판단
// MediaPipe y는 아래로 갈수록 증가. 미러 표시이므로 플레이어 관점과 일치.
// lShoulder(11).y > rShoulder(12).y → 왼쪽 어깨 낮음 → 왼쪽으로 기울어짐 → 왼쪽 이동
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
  const addExp = useGameStore((s) => s.addExp)

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [currentPose, setCurrentPose] = useState<DetectedPose>('none')
  const [moveState, setMoveState] = useState<MovementState>({ moving: false, direction: 'forward' })

  const lastPoseRef = useRef<DetectedPose>('none')
  const poseCountRef = useRef(0)
  // 왼쪽 무릎 y 히스토리 (최근 20프레임)
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
          const ms: MovementState = { moving, direction }

          // 부모 GameScene에 실시간 전달 (ref 통해서 렌더 없이)
          if (movementRef) movementRef.current = ms
          setMoveState(ms)

          // 방향 표시선
          if (moving) {
            const arrowColor = direction === 'left' ? '#ff8844' : direction === 'right' ? '#ff8844' : '#00d4ff'
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
              addExp(5)
            }
          } else {
            lastPoseRef.current = pose
            poseCountRef.current = 0
            if (pose === 'none') setCurrentPose('none')
          }
        } else {
          // 랜드마크 없으면 정지
          if (movementRef) movementRef.current = { moving: false, direction: 'forward' }
          setMoveState({ moving: false, direction: 'forward' })
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
            {/* 이동 상태 */}
            <span className="font-hud" style={{ fontSize: '0.6rem', color: moveState.moving ? '#00d4ff' : 'rgba(0,212,255,0.3)' }}>
              {moveState.moving ? DIR_LABEL[moveState.direction] : '■ 정지'}
            </span>
            {/* 스킬 자세 */}
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
