import { useGameStore } from '../../store/gameStore'
import type { CharacterId } from '../../types'

const ATTR_COLOR: Record<string, string> = {
  arc: '#00d4ff', plasma: '#ff4466', bio: '#44ff88', cryo: '#44aaff', cyber: '#aa44ff',
}

interface Props {
  onSwapRequest?: () => void
}

export default function PartySlots({ onSwapRequest }: Props) {
  const { selectedCharacters, characters, activeCharIndex, setActiveCharIndex, partyHp } = useGameStore()

  if (selectedCharacters.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      {selectedCharacters.map((id, i) => {
        const char = characters.find((c) => c.id === id as CharacterId)
        if (!char) return null
        const isActive = i === activeCharIndex
        const hp = partyHp[i] ?? { cur: 300, max: 300 }
        const pct = hp.max > 0 ? hp.cur / hp.max : 1
        const barColor = pct > 0.5 ? '#00ff88' : pct > 0.25 ? '#ffaa00' : '#ff3333'
        const color = ATTR_COLOR[char.attribute]

        return (
          <button
            key={id}
            onClick={() => setActiveCharIndex(i)}
            onDoubleClick={() => onSwapRequest?.()}
            className="text-left transition-all"
            style={{
              background: isActive ? `${color}18` : 'rgba(0,5,20,0.75)',
              border: `1px solid ${isActive ? color : 'rgba(0,212,255,0.12)'}`,
              padding: '9px 14px',
              cursor: 'pointer',
              width: 190,
              boxShadow: isActive ? `0 0 12px ${color}30` : 'none',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {isActive && (
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              )}
              {!isActive && (
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: 'rgba(0,212,255,0.2)' }} />
              )}
              <span
                className="font-hud truncate"
                style={{ fontSize: '1rem', color: isActive ? color : 'rgba(224,240,255,0.5)', flex: 1 }}
              >
                {char.name}
              </span>
              <span
                className="font-hud flex-shrink-0"
                style={{ fontSize: '0.75rem', color: isActive ? `${color}cc` : 'rgba(0,212,255,0.25)' }}
              >
                {isActive ? 'ON' : ['1ST', '2ND', '3RD', '4TH'][i]}
              </span>
            </div>
            <div className="w-full" style={{ height: 5, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <div style={{ width: `${pct * 100}%`, height: '100%', background: barColor, transition: 'width 0.3s ease' }} />
            </div>
            <div className="font-hud mt-1 text-right" style={{ fontSize: '0.75rem', color: 'rgba(224,240,255,0.35)' }}>
              {hp.cur}/{hp.max}
            </div>
          </button>
        )
      })}
    </div>
  )
}
