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
    selectedCharacters, characters, activeBooster, crystals, partyHp, activeCharIndex,
    getEquippedStats,
  } = useGameStore()

  const activeCharId = selectedCharacters[activeCharIndex] as import('../../types').CharacterId | undefined
  const accStats = activeCharId ? getEquippedStats(activeCharId) : { hp: 0, atk: 0, def: 0, critRate: 0, critDmg: 0, skillSpeed: 0, moveSpeed: 0 }

  const leadChar = characters.find((c) => c.id === selectedCharacters[0])
  const activeChar = characters.find((c) => c.id === activeCharId)
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

      {/* 중간 아래 — 활성 캐릭터 HP 바 */}
      {activeChar && (
        <div
          className="fixed z-40"
          style={{ bottom: 76, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}
        >
          {(() => {
            const hp = partyHp[activeCharIndex] ?? { cur: 300, max: 300 }
            const maxHp = hp.max + (accStats.hp ?? 0)
            const pct = maxHp > 0 ? Math.min(hp.cur / maxHp, 1) : 1
            const barColor = pct > 0.5 ? '#00ff88' : pct > 0.25 ? '#ffaa00' : '#ff3333'

            const STAT_SHORT: Record<string, string> = {
              atk: 'ATK', def: 'DEF', critRate: 'CRIT%', critDmg: 'C.DMG',
              skillSpeed: 'SKL', moveSpeed: 'MOV',
            }
            const bonusChips = Object.entries(accStats)
              .filter(([k, v]) => k !== 'hp' && v > 0)
              .map(([k, v]) => ({ label: STAT_SHORT[k] ?? k, value: v }))

            return (
              <div className="sf-panel" style={{ padding: '8px 20px', minWidth: 220 }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-hud text-sm" style={{ color: activeChar.color }}>{activeChar.name}</span>
                  <span className="font-hud text-xs" style={{ color: 'rgba(224,240,255,0.45)' }}>
                    {hp.cur} / {maxHp}
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <div style={{
                    width: `${pct * 100}%`, height: '100%',
                    background: barColor,
                    transition: 'width 0.3s ease, background 0.3s ease',
                  }} />
                </div>
                {bonusChips.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {bonusChips.map(({ label, value }) => (
                      <span key={label} className="font-hud"
                        style={{ fontSize: '0.52rem', padding: '1px 5px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700' }}>
                        {label} {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </>
  )
}
