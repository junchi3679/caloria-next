import { useGameStore } from '../../store/gameStore'
import ExerciseWarning from './ExerciseWarning'

const ATTR_LABEL: Record<string, string> = {
  arc: 'ARC', plasma: 'PLASMA', bio: 'BIO', cryo: 'CRYO', cyber: 'CYBER',
}
const LEVEL_TIER: Record<number, string> = {
  1: 'NOVICE', 11: 'TRAINEE', 21: 'SKILLED', 41: 'EXPERT', 61: 'MASTER',
}

function getTier(level: number) {
  const keys = Object.keys(LEVEL_TIER).map(Number).sort((a, b) => b - a)
  return LEVEL_TIER[keys.find((k) => level >= k) ?? 1]
}

function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

interface HUDProps {
  onOpenSwap?: () => void
}

export default function HUD({ onOpenSwap }: HUDProps) {
  const {
    playerLevel, playerExp, expToNextLevel, exerciseSeconds,
    selectedCharacters, characters, activeBooster, crystals, partyHp,
  } = useGameStore()

  const leadChar = characters.find((c) => c.id === selectedCharacters[0])
  const expPct = Math.min((playerExp / expToNextLevel) * 100, 100)
  const now = Date.now()
  const boosterActive = activeBooster && activeBooster.endsAt > now

  return (
    <>
      <ExerciseWarning />

      {/* 좌상단 — 플레이어 정보 */}
      <div className="fixed top-4 left-4 z-40">
        <div className="sf-panel px-4 py-3 holo-flicker" style={{ minWidth: 220 }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.6)' }}>LV</div>
            <div className="font-hud text-2xl text-glow leading-none">{playerLevel}</div>
            <div
              className="font-hud text-xs px-1.5 py-0.5 ml-1"
              style={{ border: '1px solid rgba(0,212,255,0.3)', color: 'rgba(0,212,255,0.7)' }}
            >
              {getTier(playerLevel)}
            </div>
          </div>

          <div className="mb-1">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(0,212,255,0.6)' }}>
              <span className="font-hud">EXP</span>
              <span>{playerExp} / {expToNextLevel}</span>
            </div>
            <div className="h-1.5 w-full rounded-none" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <div className="exp-bar-fill h-full" style={{ width: `${expPct}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.5)' }}>TIME</div>
              <div className="font-hud text-sm" style={{ color: '#00d4ff' }}>{fmtTime(exerciseSeconds)}</div>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-hud text-xs" style={{ color: '#aa44ff' }}>◈</span>
              <span className="font-hud text-sm" style={{ color: '#cc88ff' }}>{crystals.toLocaleString()}</span>
            </div>
          </div>

          {boosterActive && (
            <div className="mt-2 px-2 py-1 text-xs font-hud pulse"
              style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.4)', color: 'var(--sf-accent)' }}>
              BOOST ×{activeBooster!.multiplier}
            </div>
          )}
        </div>
      </div>

      {/* 우상단 — 리더 캐릭터 (클릭으로 파티 변경) */}
      {leadChar && (
        <div className="fixed top-4 right-4 z-40">
          <button
            className="sf-panel px-4 py-3 text-right holo-flicker w-full"
            style={{ cursor: onOpenSwap ? 'pointer' : 'default', background: 'rgba(0,10,30,0.85)' }}
            onClick={onOpenSwap}
          >
            <div className="font-hud text-lg leading-none mb-1" style={{ color: leadChar.color }}>
              {leadChar.name}
            </div>
            <div
              className="font-hud text-xs inline-block px-2 py-0.5"
              style={{ border: `1px solid ${leadChar.color}40`, color: leadChar.color, background: `${leadChar.color}12` }}
            >
              {ATTR_LABEL[leadChar.attribute]}
            </div>
            <div className="text-xs mt-1.5" style={{ color: 'rgba(224,240,255,0.5)' }}>
              {leadChar.exercise}
            </div>
            {selectedCharacters.length > 1 && (
              <div className="font-hud text-xs mt-1" style={{ color: 'rgba(0,212,255,0.4)' }}>
                PARTY · {selectedCharacters.length}
              </div>
            )}
            {onOpenSwap && (
              <div className="font-hud text-xs mt-1.5" style={{ color: 'rgba(0,212,255,0.3)', letterSpacing: '0.12em' }}>
                ↕ SWAP
              </div>
            )}
          </button>
        </div>
      )}

      {/* 중간 아래 — 파티 HP 바 */}
      {selectedCharacters.length > 0 && (
        <div
          className="fixed z-40 flex gap-1.5"
          style={{
            bottom: 76,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        >
          {selectedCharacters.map((id, i) => {
            const char = characters.find((c) => c.id === id)
            if (!char) return null
            const hp = partyHp[i] ?? { cur: 300, max: 300 }
            const pct = hp.max > 0 ? hp.cur / hp.max : 1
            const barColor = pct > 0.5 ? '#00ff88' : pct > 0.25 ? '#ffaa00' : '#ff3333'
            const shortName = char.name.length > 4 ? char.name.slice(0, 4) : char.name
            return (
              <div
                key={id}
                className="sf-panel py-1.5"
                style={{ padding: '6px 10px', minWidth: 80 }}
              >
                <div
                  className="font-hud mb-1 truncate"
                  style={{ fontSize: '0.58rem', color: char.color, letterSpacing: '0.05em' }}
                >
                  {shortName}
                </div>
                <div
                  className="w-full"
                  style={{ height: 5, background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)' }}
                >
                  <div
                    style={{
                      width: `${pct * 100}%`,
                      height: '100%',
                      background: barColor,
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }}
                  />
                </div>
                <div
                  className="font-hud mt-0.5"
                  style={{ fontSize: '0.52rem', color: 'rgba(224,240,255,0.45)', textAlign: 'right' }}
                >
                  {hp.cur}/{hp.max}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
