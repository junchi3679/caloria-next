import { useGameStore } from '../../store/gameStore'
import type { CharacterId, Character } from '../../types'

const ATTR_COLOR: Record<string, string> = {
  arc: '#00d4ff', plasma: '#ff4466', bio: '#44ff88', cryo: '#44aaff', cyber: '#aa44ff',
}
const ATTR_LABEL: Record<string, string> = {
  arc: 'ARC', plasma: 'PLASMA', bio: 'BIO', cryo: 'CRYO', cyber: 'CYBER',
}

interface Props { onClose: () => void }

export default function CharacterSwapPanel({ onClose }: Props) {
  const { characters, selectedCharacters, unlockedCharacters, toggleCharacter, swapIanGender } = useGameStore()

  const hasIan = selectedCharacters.includes('ian_m') || selectedCharacters.includes('ian_f')
  const currentIanGender = selectedCharacters.includes('ian_m') ? '남' : '여'
  const slotFull = selectedCharacters.length >= 4

  // Available unlocked characters NOT in party
  const available = characters.filter(
    (c) => unlockedCharacters.includes(c.id as CharacterId) && !selectedCharacters.includes(c.id as CharacterId),
  )

  function canAdd(c: Character): boolean {
    if (slotFull) return false
    // Ian mutual exclusion
    const otherIan = c.id === 'ian_m' ? 'ian_f' : c.id === 'ian_f' ? 'ian_m' : null
    if (otherIan && selectedCharacters.includes(otherIan)) return true // will swap
    return true
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', pointerEvents: 'auto' }}
      onClick={onClose}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: 680,
          maxHeight: '70vh',
          background: 'rgba(2,4,18,0.98)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderBottom: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
          <div className="font-hud text-sm" style={{ color: 'rgba(0,212,255,0.8)', letterSpacing: '0.15em' }}>
            PARTY MANAGEMENT
          </div>
          <div className="flex items-center gap-3">
            {hasIan && (
              <button
                onClick={swapIanGender}
                className="font-hud text-sm px-4 py-2"
                style={{
                  border: '1px solid rgba(0,212,255,0.4)',
                  color: '#00d4ff',
                  background: 'rgba(0,212,255,0.08)',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                }}
              >
                이안 성별 ({currentIanGender}) ↔
              </button>
            )}
            <button
              onClick={onClose}
              className="font-hud text-sm px-4 py-2"
              style={{ border: '1px solid rgba(255,107,53,0.3)', color: 'rgba(255,107,53,0.6)', cursor: 'pointer' }}
            >
              ✕ 닫기
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 현재 파티 */}
          <div className="flex flex-col p-4 gap-2" style={{ width: 200, borderRight: '1px solid rgba(0,212,255,0.1)', flexShrink: 0 }}>
            <div className="font-hud text-xs mb-1" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>
              CURRENT PARTY ({selectedCharacters.length}/4)
            </div>
            {[0, 1, 2, 3].map((i) => {
              const id = selectedCharacters[i]
              const char = id ? characters.find((c) => c.id === id) : null
              const color = char ? ATTR_COLOR[char.attribute] : 'rgba(0,212,255,0.15)'
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 py-2 px-3"
                  style={{
                    border: `1px solid ${char ? `${color}60` : 'rgba(0,212,255,0.1)'}`,
                    background: char ? `${color}0a` : 'transparent',
                    minHeight: 40,
                  }}
                >
                  <span className="font-hud" style={{ fontSize: '0.58rem', color: 'rgba(0,212,255,0.35)', minWidth: 22 }}>
                    {['1ST', '2ND', '3RD', '4TH'][i]}
                  </span>
                  {char ? (
                    <>
                      <span className="font-hud text-xs flex-1" style={{ color }}>{char.name}</span>
                      <button
                        onClick={() => toggleCharacter(id as CharacterId)}
                        className="font-hud"
                        style={{ fontSize: '0.8rem', color: 'rgba(255,100,100,0.5)', cursor: 'pointer', padding: '0 4px' }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="font-hud text-xs flex-1" style={{ color: 'rgba(0,212,255,0.2)' }}>빈 슬롯</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* 사용 가능한 캐릭터 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="font-hud text-xs mb-3" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>
              AVAILABLE OPERATIVES
            </div>
            {available.length === 0 ? (
              <div className="text-center py-8">
                <div className="font-hud text-sm" style={{ color: 'rgba(0,212,255,0.2)' }}>
                  {slotFull ? '슬롯 가득 참 — 파티원을 제거해 주세요' : '추가 가능한 요원 없음'}
                </div>
              </div>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {available.map((c) => {
                  const color = ATTR_COLOR[c.attribute]
                  const addable = canAdd(c)
                  return (
                    <button
                      key={c.id}
                      onClick={() => { if (addable) toggleCharacter(c.id as CharacterId) }}
                      disabled={!addable}
                      className="text-left p-3 transition-all"
                      style={{
                        border: `1px solid ${addable ? `${color}50` : 'rgba(0,212,255,0.08)'}`,
                        background: addable ? `${color}0a` : 'rgba(0,0,0,0.2)',
                        cursor: addable ? 'pointer' : 'not-allowed',
                        opacity: addable ? 1 : 0.4,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 flex-shrink-0" style={{ background: color }} />
                        <span className="font-hud text-xs" style={{ color }}>{c.name}</span>
                      </div>
                      <div className="font-hud px-1.5 py-0.5 inline-block mb-1" style={{ fontSize: '0.55rem', border: `1px solid ${color}40`, color, background: `${color}10` }}>
                        {ATTR_LABEL[c.attribute]}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(224,240,255,0.4)', fontSize: '0.6rem' }}>
                        {c.exercise}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* 잠긴 캐릭터 섹션 */}
            {characters.filter(c => !unlockedCharacters.includes(c.id as CharacterId)).length > 0 && (
              <div className="mt-4">
                <div className="font-hud text-xs mb-2" style={{ color: 'rgba(0,212,255,0.3)', letterSpacing: '0.15em' }}>
                  LOCKED
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {characters
                    .filter(c => !unlockedCharacters.includes(c.id as CharacterId))
                    .map((c) => (
                      <div key={c.id} className="p-3" style={{ border: '1px solid rgba(255,255,255,0.05)', opacity: 0.5 }}>
                        <div className="font-hud text-xs mb-0.5" style={{ color: 'rgba(224,240,255,0.3)' }}>{c.name}</div>
                        <div className="font-hud" style={{ fontSize: '0.6rem', color: c.unlockType === 'gacha' ? 'rgba(170,68,255,0.5)' : 'rgba(0,212,255,0.4)' }}>
                          {c.unlockType === 'gacha' ? 'PORTAL 소환' : (c.unlockHint ?? '')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
