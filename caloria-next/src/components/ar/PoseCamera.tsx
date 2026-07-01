import { useEffect, useRef, useState } from 'react'
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'

// MediaPipe Pose 랜드마크 0~10번은 얼굴(코/눈/귀/입) — 몸통 동작 인식에는 쓰이지 않으므로 표시에서 제외
const BODY_START_IDX = 11
const BODY_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS.filter(
  (c) => c.start >= BODY_START_IDX && c.end >= BODY_START_IDX,
)

type LM = { x: number; y: number; z: number; visibility?: number }

// 사람 다리로 인정할 최소 신뢰도 — 의자/책상 다리 같은 배경 사물은
// 모델이 확신을 갖고 감지하지 못해 visibility가 낮게 나오는 점을 이용해 걸러낸다
const LEG_VISIBILITY_MIN = 0.6
const LEG_LANDMARK_IDX = [23, 24, 25, 26, 27, 28] // 좌우 엉덩이·무릎·발목

function isHumanLegVisible(lm: LM[]): boolean {
  return LEG_LANDMARK_IDX.every((i) => (lm[i]?.visibility ?? 0) >= LEG_VISIBILITY_MIN)
}

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

// ── 이동 감지 ──────────────────────────────────────────────

// 무릎 높이 기록에서 방향 전환(반전) 횟수를 센다 — 걷기는 오르내림이 반복되지만
// 스쿼트/점프 같은 단발성 동작은 반전이 1회 이하인 경우가 대부분이라 걷기와 구분할 수 있다
function countReversals(history: number[]): number {
  let reversals = 0
  let lastDir = 0
  for (let i = 1; i < history.length; i++) {
    const diff = history[i] - history[i - 1]
    if (Math.abs(diff) < 0.002) continue
    const dir = diff > 0 ? 1 : -1
    if (lastDir !== 0 && dir !== lastDir) reversals++
    lastDir = dir
  }
  return reversals
}

function detectMarching(kneeHistory: number[]): boolean {
  if (kneeHistory.length < 12) return false
  const min = Math.min(...kneeHistory)
  const max = Math.max(...kneeHistory)
  if (max - min < 0.045) return false
  return countReversals(kneeHistory) >= 2
}

// 팔(손목 높이)이 실제로 움직였는지 판정 — 팔을 흔들면 공격이 나가도록
function detectArmSwing(wristHistory: number[]): boolean {
  if (wristHistory.length < 10) return false
  const min = Math.min(...wristHistory)
  const max = Math.max(...wristHistory)
  if (max - min < 0.05) return false
  return countReversals(wristHistory) >= 1
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
  const wristHistoryRef = useRef<number[]>([])

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
          draw.drawLandmarks(lm.slice(BODY_START_IDX), { color: '#00d4ff', lineWidth: 2, radius: 3 })
          draw.drawConnectors(lm, BODY_CONNECTIONS, { color: 'rgba(0,212,255,0.5)', lineWidth: 1.5 })

          // ── 손목 높이 기록 — 팔을 흔드는 움직임을 감지하기 위함 ──
          const lWristY = lm[15]?.y ?? 0
          const rWristY = lm[16]?.y ?? 0
          wristHistoryRef.current.push((lWristY + rWristY) / 2)
          if (wristHistoryRef.current.length > 20) wristHistoryRef.current.shift()

          // ── 스킬 자세 감지 (이동 판정보다 먼저 계산해서 걷기와 구분) ──
          let pose: DetectedPose = 'none'
          if (detectSquat(lm)) pose = 'squat'
          else if (detectPlank(lm)) pose = 'plank'
          else if (detectArmSwing(wristHistoryRef.current)) pose = 'jump'

          // ── 이동 감지 — 사람 다리가 확실히 보일 때만 (의자·책상 다리 등 오탐 방지) ──
          const legVisible = isHumanLegVisible(lm)
          if (legVisible) {
            const lKneeY = lm[25]?.y ?? 0
            kneeHistoryRef.current.push(lKneeY)
            if (kneeHistoryRef.current.length > 20) kneeHistoryRef.current.shift()
          } else {
            kneeHistoryRef.current = []
          }

          // 스쿼트/플랭크/점프 등 다른 자세 중에는 이동하지 않음
          const moving = legVisible && pose === 'none' && detectMarching(kneeHistoryRef.current)
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
      <div className="relative" style={{ width: 280, height: 210 }}>
        <video ref={videoRef} muted playsInline style={{ display: 'none' }} />
        <canvas ref={canvasRef} width={280} height={210} className="w-full h-full" style={{ transform: 'scaleX(-1)' }} />

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
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-2.5 py-1.5"
            style={{ background: 'rgba(0,10,20,0.75)', borderTop: '1px solid rgba(0,212,255,0.15)' }}>
            <span className="font-hud" style={{ fontSize: '0.75rem', color: moveState.moving ? '#00d4ff' : 'rgba(0,212,255,0.3)' }}>
              {moveState.moving ? DIR_LABEL[moveState.direction] : '■ 정지'}
            </span>
            {moveState.moving && (
              <span className="font-hud" style={{ fontSize: '0.7rem', color: 'rgba(0,212,255,0.6)' }}>
                SPD {Math.round(moveState.speed * 100)}%
              </span>
            )}
            {currentPose !== 'none' && (
              <span className="font-hud" style={{ fontSize: '0.75rem', color: 'var(--sf-accent)' }}>
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
