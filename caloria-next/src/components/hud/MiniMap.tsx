import { useEffect, useState } from 'react'
import type { MapSnapshot } from '../../types'

interface Props {
  mapRef: React.MutableRefObject<MapSnapshot>
}

const SIZE = 110
const C = SIZE / 2
const WORLD_RADIUS = 65  // world units shown on map

function toMap(dx: number, dz: number): [number, number] {
  const scale = C / WORLD_RADIUS
  return [C + dx * scale, C + dz * scale]
}

export default function MiniMap({ mapRef }: Props) {
  const [snap, setSnap] = useState<MapSnapshot>({
    px: 0, pz: 0, pa: Math.PI,
    enemies: [],
  })

  useEffect(() => {
    const id = setInterval(() => setSnap({ ...mapRef.current }), 150)
    return () => clearInterval(id)
  }, [mapRef])

  // Player heading → SVG rotation (degrees, clockwise from up)
  // pa = π means facing -Z = up on map
  const headingDeg = (180 - (snap.pa * 180) / Math.PI + 360) % 360

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} style={{ overflow: 'visible' }}>
        {/* Clip circle */}
        <defs>
          <clipPath id="mmClip">
            <circle cx={C} cy={C} r={C - 2} />
          </clipPath>
        </defs>

        {/* Background */}
        <circle cx={C} cy={C} r={C - 1} fill="rgba(2,0,12,0.88)" stroke="rgba(0,212,255,0.35)" strokeWidth={1} />

        <g clipPath="url(#mmClip)">
          {/* Grid */}
          {[-40, -20, 0, 20, 40].map((v) => {
            const scale = C / WORLD_RADIUS
            const sv = v * scale
            return (
              <g key={v}>
                <line x1={C + sv} y1={0} x2={C + sv} y2={SIZE} stroke="rgba(0,212,255,0.06)" strokeWidth={0.5} />
                <line x1={0} y1={C + sv} x2={SIZE} y2={C + sv} stroke="rgba(0,212,255,0.06)" strokeWidth={0.5} />
              </g>
            )
          })}

          {/* Enemies */}
          {snap.enemies.map((e, i) => {
            if (!e.alive) return null
            const dx = e.x - snap.px
            const dz = e.z - snap.pz
            const [mx, my] = toMap(dx, dz)
            if (mx < 0 || mx > SIZE || my < 0 || my > SIZE) return null
            return (
              <circle
                key={i}
                cx={mx} cy={my}
                r={e.type === 'boss' ? 4.5 : 2.5}
                fill={e.type === 'boss' ? '#ff4400' : '#ff2222'}
                opacity={0.9}
              />
            )
          })}

          {/* Player arrow */}
          <g transform={`rotate(${headingDeg}, ${C}, ${C})`}>
            <polygon
              points={`${C},${C - 9} ${C - 4},${C + 5} ${C + 4},${C + 5}`}
              fill="#00d4ff"
              stroke="rgba(0,212,255,0.3)"
              strokeWidth={0.5}
            />
            <polygon
              points={`${C},${C + 11} ${C - 3},${C + 4} ${C + 3},${C + 4}`}
              fill="rgba(0,212,255,0.2)"
            />
          </g>

          {/* Center dot */}
          <circle cx={C} cy={C} r={2} fill="rgba(0,212,255,0.9)" />
        </g>

        {/* Outer frame decorations */}
        <line x1={2} y1={2} x2={7} y2={2} stroke="rgba(0,212,255,0.5)" strokeWidth={1.5} />
        <line x1={2} y1={2} x2={2} y2={7} stroke="rgba(0,212,255,0.5)" strokeWidth={1.5} />
        <line x1={SIZE - 2} y1={SIZE - 2} x2={SIZE - 7} y2={SIZE - 2} stroke="rgba(0,212,255,0.5)" strokeWidth={1.5} />
        <line x1={SIZE - 2} y1={SIZE - 2} x2={SIZE - 2} y2={SIZE - 7} stroke="rgba(0,212,255,0.5)" strokeWidth={1.5} />
      </svg>

      {/* Enemy count badge */}
      <div
        className="absolute font-hud"
        style={{
          bottom: -14, left: 0, right: 0,
          textAlign: 'center',
          fontSize: '0.58rem',
          color: 'rgba(0,212,255,0.55)',
          letterSpacing: '0.08em',
        }}
      >
        {snap.enemies.filter((e) => e.alive).length} HOSTILES
      </div>
    </div>
  )
}
