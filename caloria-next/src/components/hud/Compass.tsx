import { useEffect, useState } from 'react'

interface Props {
  compassRef: React.MutableRefObject<number>
}

const SIZE = 104
const R = SIZE / 2

export default function Compass({ compassRef }: Props) {
  const [angleDeg, setAngleDeg] = useState(0)

  // 100ms마다 각도 읽어서 렌더
  useEffect(() => {
    const id = setInterval(() => {
      // Three.js rotation.y → heading(도): 0 = 북, 90 = 동, 180 = 남, 270 = 서
      const raw = compassRef.current
      const deg = ((raw * 180) / Math.PI) % 360
      setAngleDeg(deg < 0 ? deg + 360 : deg)
    }, 80)
    return () => clearInterval(id)
  }, [compassRef])

  // 눈금 회전 (지도 고정, 마커가 돌아야 하므로 반대 방향)
  const ringRot = -angleDeg

  function dirPos(labelDeg: number, r: number) {
    const rad = ((labelDeg - 90) * Math.PI) / 180
    return { x: R + Math.cos(rad) * r, y: R + Math.sin(rad) * r }
  }

  // 현재 방위 텍스트
  function heading(d: number) {
    if (d < 22.5 || d >= 337.5) return 'N'
    if (d < 67.5) return 'NE'
    if (d < 112.5) return 'E'
    if (d < 157.5) return 'SE'
    if (d < 202.5) return 'S'
    if (d < 247.5) return 'SW'
    if (d < 292.5) return 'W'
    return 'NW'
  }

  return (
    <div
      style={{
        position: 'relative',
        width: SIZE,
        height: SIZE,
        flexShrink: 0,
      }}
    >
      <svg width={SIZE} height={SIZE} style={{ overflow: 'visible' }}>
        {/* 외곽 원 */}
        <circle cx={R} cy={R} r={R - 1} fill="rgba(0,10,20,0.82)" stroke="rgba(0,212,255,0.35)" strokeWidth={1} />

        {/* 회전하는 눈금 그룹 */}
        <g transform={`rotate(${ringRot}, ${R}, ${R})`}>
          {/* 12개 작은 눈금 */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180
            const inner = R - 14
            const outer = R - 6
            const x1 = R + Math.cos(a - Math.PI / 2) * inner
            const y1 = R + Math.sin(a - Math.PI / 2) * inner
            const x2 = R + Math.cos(a - Math.PI / 2) * outer
            const y2 = R + Math.sin(a - Math.PI / 2) * outer
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(0,212,255,0.3)" strokeWidth={i % 3 === 0 ? 1.5 : 0.8} />
            )
          })}

          {/* N — 빨간색 강조 */}
          {(['N', 'E', 'S', 'W'] as const).map((dir, i) => {
            const deg = i * 90
            const { x, y } = dirPos(deg, R - 26)
            const isN = dir === 'N'
            return (
              <text key={dir} x={x} y={y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={isN ? 16 : 13}
                fontFamily="Orbitron, monospace"
                fontWeight={isN ? 700 : 500}
                fill={isN ? '#ff4444' : 'rgba(0,212,255,0.85)'}
              >
                {dir}
              </text>
            )
          })}
        </g>

        {/* 중앙 고정 삼각형 포인터 (항상 위쪽 = 현재 향하는 방향) */}
        <polygon
          points={`${R},${R - 33} ${R - 6},${R - 15} ${R + 6},${R - 15}`}
          fill="rgba(0,212,255,0.9)"
          stroke="rgba(0,212,255,0.3)"
          strokeWidth={0.5}
        />
        {/* 반대 방향 (뒤쪽) 작은 삼각형 */}
        <polygon
          points={`${R},${R + 33} ${R - 5},${R + 15} ${R + 5},${R + 15}`}
          fill="rgba(0,212,255,0.25)"
          strokeWidth={0}
        />

        {/* 중심 점 */}
        <circle cx={R} cy={R} r={4} fill="rgba(0,212,255,0.8)" />

        {/* 코너 장식 — 좌상 */}
        <line x1={3} y1={3} x2={12} y2={3} stroke="rgba(0,212,255,0.6)" strokeWidth={1.5} />
        <line x1={3} y1={3} x2={3} y2={12} stroke="rgba(0,212,255,0.6)" strokeWidth={1.5} />
        {/* 코너 장식 — 우하 */}
        <line x1={SIZE - 3} y1={SIZE - 3} x2={SIZE - 12} y2={SIZE - 3} stroke="rgba(0,212,255,0.6)" strokeWidth={1.5} />
        <line x1={SIZE - 3} y1={SIZE - 3} x2={SIZE - 3} y2={SIZE - 12} stroke="rgba(0,212,255,0.6)" strokeWidth={1.5} />
      </svg>

      {/* 현재 방위 텍스트 — 나침반 아래 */}
      <div
        style={{
          position: 'absolute',
          bottom: -22,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Orbitron, monospace',
          fontSize: '0.85rem',
          color: 'rgba(0,212,255,0.7)',
          letterSpacing: '0.1em',
        }}
      >
        {heading(angleDeg)}
      </div>
    </div>
  )
}
