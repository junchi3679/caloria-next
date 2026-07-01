import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { MapSnapshot } from '../../types'

interface Props {
  mapRef: React.MutableRefObject<MapSnapshot>
}

const SIZE = 130
const C = SIZE / 2
const WORLD_RADIUS = 65

function toMiniMap(dx: number, dz: number): [number, number] {
  const scale = C / WORLD_RADIUS
  return [C + dx * scale, C + dz * scale]
}

// ── 전체화면 확장 맵 (미니맵 + 닫기만) ───────────────────
const ZOOM_MIN = 0.2
const ZOOM_MAX = 8
const ZOOM_STEP = 0.12

function ExpandedMap({ snap, onClose }: { snap: MapSnapshot; onClose: () => void }) {
  const [wsize, setWsize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const fn = () => setWsize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const { w: W, h: H } = wsize

  // 기준 스케일 (zoom=1 일 때 20배 시야)
  const BASE_RADIUS = WORLD_RADIUS * 20
  const baseScale = (Math.min(W, H) * 0.45) / BASE_RADIUS

  const [zoom, setZoom] = useState(1)
  const scale = baseScale * zoom

  const [pan, setPan] = useState<[number, number]>([0, 0])
  const panRef = useRef(pan)
  panRef.current = pan
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  const dragRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const headingDeg = (180 - (snap.pa * 180) / Math.PI + 360) % 360
  const playerX = W / 2 + pan[0]
  const playerY = H / 2 + pan[1]

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { mx: e.clientX, my: e.clientY, px: pan[0], py: pan[1] }
    setDragging(true)
  }, [pan])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return
    setPan([
      dragRef.current.px + e.clientX - dragRef.current.mx,
      dragRef.current.py + e.clientY - dragRef.current.my,
    ])
  }, [])

  const stopDrag = useCallback(() => {
    dragRef.current = null
    setDragging(false)
  }, [])

  // 화면 중앙 기준 줌
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current * factor))
    const ratio = newZoom / zoomRef.current
    // 화면 중앙(W/2, H/2) 고정 — pan만 비율 보정
    setPan(([px, py]) => [px * ratio, py * ratio])
    setZoom(newZoom)
  }, [])

  // 그리드
  const gridLines: React.ReactNode[] = []
  const gridStep = 50
  const gridCount = Math.ceil(BASE_RADIUS / gridStep) + 4
  for (let i = -gridCount; i <= gridCount; i++) {
    const sv = i * gridStep * scale
    gridLines.push(
      <line key={`v${i}`} x1={playerX + sv} y1={0} x2={playerX + sv} y2={H}
        stroke="rgba(0,212,255,0.07)" strokeWidth={0.5} />,
      <line key={`h${i}`} x1={0} y1={playerY + sv} x2={W} y2={playerY + sv}
        stroke="rgba(0,212,255,0.07)" strokeWidth={0.5} />
    )
  }

  return (
    <div
      className="fixed"
      style={{
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        background: 'rgba(0,0,8,0.96)',
        cursor: dragging ? 'grabbing' : 'grab',
        overflow: 'hidden',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onWheel={onWheel}
    >
      {/* 지도 SVG */}
      <svg
        style={{ display: 'block', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', userSelect: 'none' }}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        {gridLines}

        {/* 기본 시야 참조 원 */}
        <circle cx={playerX} cy={playerY} r={WORLD_RADIUS * scale}
          fill="none" stroke="rgba(0,212,255,0.12)" strokeWidth={1} strokeDasharray="3 5" />

        {/* 적 */}
        {snap.enemies.map((e, i) => {
          if (!e.alive) return null
          const sx = playerX + (e.x - snap.px) * scale
          const sy = playerY + (e.z - snap.pz) * scale
          return (
            <g key={i}>
              {e.type === 'boss' && (
                <circle cx={sx} cy={sy} r={16} fill="rgba(255,68,0,0.08)" stroke="rgba(255,68,0,0.3)" strokeWidth={1} />
              )}
              <circle cx={sx} cy={sy} r={e.type === 'boss' ? 7 : 4}
                fill={e.type === 'boss' ? '#ff4400' : '#ff2222'} opacity={0.9} />
            </g>
          )
        })}

        {/* 플레이어 */}
        <g transform={`rotate(${headingDeg}, ${playerX}, ${playerY})`}>
          <polygon
            points={`${playerX},${playerY - 14} ${playerX - 7},${playerY + 9} ${playerX + 7},${playerY + 9}`}
            fill="#00d4ff" stroke="rgba(0,212,255,0.5)" strokeWidth={1.5}
          />
        </g>
        <circle cx={playerX} cy={playerY} r={3} fill="#00d4ff" />
      </svg>

      {/* 우상단 HUD */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10000, display: 'flex', alignItems: 'center', gap: 10 }}
        onMouseDown={(e) => e.stopPropagation()}>
        <span className="font-hud" style={{ fontSize: '0.65rem', color: 'rgba(0,212,255,0.45)', letterSpacing: '0.1em' }}>
          ×{(zoom * 20).toFixed(1)} &nbsp;🖱 스크롤 줌
        </span>
        <button
          className="font-hud"
          style={{
            padding: '10px 22px',
            border: '1px solid rgba(0,212,255,0.4)',
            color: 'rgba(0,212,255,0.8)',
            background: 'rgba(0,0,8,0.85)',
            cursor: 'pointer',
            letterSpacing: '0.1em',
            fontSize: '0.85rem',
          }}
          onClick={onClose}
        >
          ✕ 닫기
        </button>
      </div>
    </div>
  )
}

// ── 기본 미니맵 (축소) ────────────────────────────────────
export default function MiniMap({ mapRef }: Props) {
  const [snap, setSnap] = useState<MapSnapshot>({ px: 0, pz: 0, pa: Math.PI, enemies: [] })
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setSnap({ ...mapRef.current }), 150)
    return () => clearInterval(id)
  }, [mapRef])

  const headingDeg = (180 - (snap.pa * 180) / Math.PI + 360) % 360

  return (
    <>
      <div
        style={{ position: 'relative', width: SIZE, height: SIZE, cursor: 'pointer' }}
        onClick={() => setExpanded(true)}
        title="클릭하여 확장"
      >
        <svg width={SIZE} height={SIZE} style={{ overflow: 'visible' }}>
          <defs>
            <clipPath id="mmClip">
              <circle cx={C} cy={C} r={C - 2} />
            </clipPath>
          </defs>

          <circle cx={C} cy={C} r={C - 1} fill="rgba(2,0,12,0.88)" stroke="rgba(0,212,255,0.35)" strokeWidth={1} />

          <g clipPath="url(#mmClip)">
            {[-40, -20, 0, 20, 40].map((v) => {
              const sv = v * (C / WORLD_RADIUS)
              return (
                <g key={v}>
                  <line x1={C + sv} y1={0} x2={C + sv} y2={SIZE} stroke="rgba(0,212,255,0.06)" strokeWidth={0.5} />
                  <line x1={0} y1={C + sv} x2={SIZE} y2={C + sv} stroke="rgba(0,212,255,0.06)" strokeWidth={0.5} />
                </g>
              )
            })}

            {snap.enemies.map((e, i) => {
              if (!e.alive) return null
              const dx = e.x - snap.px
              const dz = e.z - snap.pz
              const [mx, my] = toMiniMap(dx, dz)
              if (mx < 0 || mx > SIZE || my < 0 || my > SIZE) return null
              return (
                <circle key={i} cx={mx} cy={my} r={e.type === 'boss' ? 6 : 3}
                  fill={e.type === 'boss' ? '#ff4400' : '#ff2222'} opacity={0.9} />
              )
            })}

            <g transform={`rotate(${headingDeg}, ${C}, ${C})`}>
              <polygon points={`${C},${C - 11} ${C - 5.5},${C + 6.5} ${C + 5.5},${C + 6.5}`}
                fill="#00d4ff" stroke="rgba(0,212,255,0.3)" strokeWidth={0.5} />
            </g>
            <circle cx={C} cy={C} r={2.5} fill="rgba(0,212,255,0.9)" />
          </g>

          {/* 코너 장식 */}
          <line x1={1} y1={1} x2={10} y2={1} stroke="rgba(0,212,255,0.5)" strokeWidth={1.2} />
          <line x1={1} y1={1} x2={1} y2={10} stroke="rgba(0,212,255,0.5)" strokeWidth={1.2} />
          <line x1={SIZE - 1} y1={SIZE - 1} x2={SIZE - 10} y2={SIZE - 1} stroke="rgba(0,212,255,0.5)" strokeWidth={1.2} />
          <line x1={SIZE - 1} y1={SIZE - 1} x2={SIZE - 1} y2={SIZE - 10} stroke="rgba(0,212,255,0.5)" strokeWidth={1.2} />
        </svg>

        {/* 적 카운트 */}
        <div className="absolute font-hud" style={{
          bottom: -16, left: 0, right: 0, textAlign: 'center',
          fontSize: '0.7rem', color: 'rgba(0,212,255,0.5)', letterSpacing: '0.06em',
        }}>
          {snap.enemies.filter((e) => e.alive).length} HOSTILES
        </div>
      </div>

      {expanded && createPortal(
        <ExpandedMap snap={snap} onClose={() => setExpanded(false)} />,
        document.body
      )}
    </>
  )
}
