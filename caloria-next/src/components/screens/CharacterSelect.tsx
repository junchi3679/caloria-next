import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { CharacterId, Character } from '../../types'

// Ian is a single entity — show only one entry but allow M/F toggle
// The store's toggleCharacter handles mutual exclusion automatically

const ATTR_LABEL: Record<string, string> = {
  arc: 'ARC', plasma: 'PLASMA', bio: 'BIO', cryo: 'CRYO', cyber: 'CYBER',
}
const ATTR_COLOR: Record<string, string> = {
  arc: '#00d4ff', plasma: '#ff4466', bio: '#44ff88', cryo: '#44aaff', cyber: '#aa44ff',
}
const ATTR_DESC: Record<string, string> = {
  arc: '스피드 / 달리기 / 파쿠르', plasma: '파워 / 근력 / 웨이트',
  bio: '유연성 / 요가 / 회복', cryo: '지구력 / 유산소 / HIIT', cyber: '균형 / 코어 / 정밀',
}

function CharCard({
  char,
  slotIndex,
  locked,
  onClick,
}: {
  char: Character
  slotIndex: number
  locked: boolean
  onClick: () => void
}) {
  const selected = slotIndex >= 0
  const color = ATTR_COLOR[char.attribute]
  const SLOT_LABELS = ['1ST', '2ND', '3RD', '4TH']

  if (locked) {
    const isGacha = char.unlockType === 'gacha'
    return (
      <div
        className="relative p-3"
        style={{
          background: 'rgba(0,5,15,0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
          opacity: 0.65,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-1 self-stretch" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-hud text-sm" style={{ color: 'rgba(224,240,255,0.35)' }}>{char.name}</span>
              <span className="font-hud text-xs px-1.5 py-0.5" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.2)' }}>
                {ATTR_LABEL[char.attribute]}
              </span>
            </div>
            <div className="font-hud text-xs" style={{ color: isGacha ? '#aa44ff60' : 'rgba(0,212,255,0.4)' }}>
              {isGacha ? 'PORTAL 소환' : (char.unlockHint ?? '')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="relative text-left transition-all duration-200 w-full"
      style={{
        background: selected ? `${color}18` : 'rgba(0,20,40,0.7)',
        border: `1px solid ${selected ? color : 'rgba(0,212,255,0.15)'}`,
        boxShadow: selected ? `0 0 18px ${color}38` : 'none',
        padding: '12px 16px',
        cursor: 'pointer',
      }}
    >
      {selected && (
        <>
          <span style={{ position: 'absolute', top: -1, left: -1, width: 8, height: 8, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
          <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
          <span className="absolute font-hud" style={{ top: 6, right: 8, fontSize: '0.58rem', color, border: `1px solid ${color}60`, padding: '1px 5px', background: `${color}20` }}>
            {SLOT_LABELS[slotIndex]}
          </span>
        </>
      )}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-1 self-stretch" style={{ background: color, opacity: selected ? 1 : 0.3 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-hud text-sm" style={{ color: selected ? color : '#c0d8f0' }}>{char.name}</span>
            <span className="font-hud text-xs px-2 py-0.5" style={{ border: `1px solid ${color}50`, color, background: `${color}15` }}>
              {ATTR_LABEL[char.attribute]}
            </span>
          </div>
          <div className="text-xs" style={{ color: 'rgba(0,212,255,0.5)' }}>{char.exercise}</div>
          {selected && (
            <div className="text-xs leading-snug mt-1" style={{ color: 'rgba(224,240,255,0.65)' }}>
              {char.description}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export default function CharacterSelect() {
  const { characters, selectedCharacters, unlockedCharacters, toggleCharacter, swapIanGender, setScreen } = useGameStore()
  const hasIan = selectedCharacters.includes('ian_m') || selectedCharacters.includes('ian_f')
  const currentIanId = selectedCharacters.includes('ian_m') ? 'ian_m' : selectedCharacters.includes('ian_f') ? 'ian_f' : null
  const [hoveredAttr, setHoveredAttr] = useState<string | null>(null)

  // 섹션 분류: 기본 → 스토리 → 가챠
  const defaultChars = characters.filter((c) => c.unlockType === 'default')
  const storyChars = characters.filter((c) => c.unlockType === 'story')
  const gachaChars = characters.filter((c) => c.unlockType === 'gacha')

  const leadChar = characters.find((c) => c.id === selectedCharacters[0])
  const slotFull = selectedCharacters.length >= 4

  function handleConfirm() {
    if (selectedCharacters.length > 0) setScreen('game')
  }

  function isLocked(c: Character) {
    return !unlockedCharacters.includes(c.id as CharacterId)
  }

  function renderSection(label: string, chars: Character[]) {
    return (
      <div>
        <div className="font-hud text-xs mb-2 px-1" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>
          ── {label} ──
        </div>
        <div className="flex flex-col gap-2">
          {chars.map((c) => {
            const si = selectedCharacters.indexOf(c.id as CharacterId)
            const locked = isLocked(c)
            return (
              <CharCard
                key={c.id}
                char={c}
                slotIndex={si}
                locked={locked}
                onClick={() => {
                  if (locked) return
                  if (si === -1 && slotFull) return
                  toggleCharacter(c.id as CharacterId)
                }}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 scanline flex flex-col" style={{ background: 'var(--sf-bg)' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* 헤더 */}
      <div className="relative z-10 px-8 pt-8 pb-4">
        <div className="font-hud text-xs text-glow mb-1" style={{ color: 'rgba(0,212,255,0.6)', letterSpacing: '0.2em' }}>
          CALORIA : NEXT GENERATION
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-hud text-3xl text-glow" style={{ letterSpacing: '0.05em' }}>SELECT OPERATIVES</h1>
            <div className="text-sm mt-1" style={{ color: 'rgba(224,240,255,0.5)' }}>최대 4명까지 함께 파견 가능</div>
          </div>
          {/* 슬롯 카운터 + PORTAL 버튼 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScreen('gacha')}
              className="font-hud text-xs px-4 py-2"
              style={{
                border: '1px solid rgba(170,68,255,0.5)',
                color: '#cc88ff',
                background: 'rgba(170,68,255,0.08)',
                cursor: 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              ◈ PORTAL
            </button>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="font-hud text-xs px-2 py-1" style={{
                  width: 32, border: `1px solid ${i < selectedCharacters.length ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.15)'}`,
                  background: i < selectedCharacters.length ? 'rgba(0,212,255,0.1)' : 'transparent',
                  color: i < selectedCharacters.length ? 'rgba(0,212,255,0.9)' : 'rgba(0,212,255,0.2)',
                  textAlign: 'center',
                }}>
                  {i < selectedCharacters.length ? (i + 1) : '·'}
                </div>
              ))}
              <div className="font-hud text-xs ml-1" style={{ color: 'rgba(0,212,255,0.5)' }}>
                {selectedCharacters.length} / 4
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 gap-6 px-8 pb-8 overflow-hidden">

        {/* 좌측: 캐릭터 목록 */}
        <div className="flex flex-col gap-4 w-80 flex-shrink-0 overflow-y-auto">
          {renderSection('DEFAULT', defaultChars)}
          {renderSection('STORY', storyChars)}
          {renderSection('PORTAL', gachaChars)}
        </div>

        {/* 우측: 상세 */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="sf-panel flex-1 p-6 holo-flicker">
            {leadChar ? (
              <div className="h-full flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{
                    border: `1px solid ${ATTR_COLOR[leadChar.attribute]}50`,
                    background: `${ATTR_COLOR[leadChar.attribute]}10`,
                  }}>
                    <span className="font-hud text-xs" style={{ color: ATTR_COLOR[leadChar.attribute] }}>
                      {ATTR_LABEL[leadChar.attribute]}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-hud text-2xl" style={{ color: ATTR_COLOR[leadChar.attribute] }}>
                        {leadChar.name}
                      </h2>
                      <span className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.5)' }}>LEADER</span>
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(0,212,255,0.6)' }}>
                      {ATTR_DESC[leadChar.attribute]}
                    </div>
                  </div>
                </div>

                <div className="mb-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.15)' }} />

                {/* 이안 성별 스왑 버튼 */}
                {hasIan && leadChar && (currentIanId === leadChar.id || selectedCharacters[0] === leadChar.id) && (
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.5)' }}>성별</span>
                    {(['ian_m', 'ian_f'] as CharacterId[]).map((id) => {
                      const isActive = selectedCharacters.includes(id)
                      return (
                        <button
                          key={id}
                          onClick={() => { if (!isActive) swapIanGender() }}
                          className="font-hud text-xs px-3 py-1"
                          style={{
                            border: `1px solid ${isActive ? '#00d4ff' : 'rgba(0,212,255,0.2)'}`,
                            color: isActive ? '#00d4ff' : 'rgba(0,212,255,0.35)',
                            background: isActive ? 'rgba(0,212,255,0.1)' : 'transparent',
                            cursor: isActive ? 'default' : 'pointer',
                            letterSpacing: '0.1em',
                          }}
                        >
                          {id === 'ian_m' ? '남 (M)' : '여 (F)'}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="mb-5">
                  <div className="font-hud text-xs mb-2" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>BACKGROUND</div>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(224,240,255,0.8)' }}>
                    {leadChar.description}
                  </p>
                </div>

                {selectedCharacters.length > 1 && (
                  <div className="mb-5">
                    <div className="font-hud text-xs mb-3" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>PARTY</div>
                    <div className="flex flex-col gap-1.5">
                      {selectedCharacters.map((id, i) => {
                        const c = characters.find((ch) => ch.id === id)!
                        return (
                          <div key={id} className="flex items-center gap-3">
                            <span className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.35)', width: 28 }}>
                              {['1ST', '2ND', '3RD', '4TH'][i]}
                            </span>
                            <div className="w-2 h-2" style={{ background: c.color, flexShrink: 0 }} />
                            <span className="font-hud text-xs" style={{ color: c.color }}>{c.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex-1" />

                {slotFull && (
                  <div className="font-hud text-xs mb-3 text-center" style={{ color: 'rgba(0,212,255,0.4)' }}>
                    슬롯 가득 참 — 클릭하여 해제
                  </div>
                )}

                <button
                  className="sf-btn-accent w-full py-3"
                  style={{
                    fontFamily: 'Orbitron, monospace', fontSize: '0.75rem', letterSpacing: '0.15em',
                    border: `1px solid ${ATTR_COLOR[leadChar.attribute]}`,
                    color: ATTR_COLOR[leadChar.attribute],
                    background: `${ATTR_COLOR[leadChar.attribute]}10`,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onClick={handleConfirm}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${ATTR_COLOR[leadChar.attribute]}25` }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${ATTR_COLOR[leadChar.attribute]}10` }}
                >
                  DEPLOY — {selectedCharacters.length} OPERATIVE{selectedCharacters.length > 1 ? 'S' : ''}
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="font-hud text-4xl mb-4 pulse" style={{ color: 'rgba(0,212,255,0.2)' }}>◈</div>
                  <div className="font-hud text-sm" style={{ color: 'rgba(0,212,255,0.3)', letterSpacing: '0.15em' }}>SELECT AN OPERATIVE</div>
                </div>
              </div>
            )}
          </div>

          {/* 속성 레전드 */}
          <div className="sf-panel p-4">
            <div className="font-hud text-xs mb-3" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>ATTRIBUTE LEGEND</div>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(ATTR_LABEL).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 cursor-default"
                  onMouseEnter={() => setHoveredAttr(key)}
                  onMouseLeave={() => setHoveredAttr(null)}>
                  <div className="w-2 h-2" style={{ background: ATTR_COLOR[key] }} />
                  <span className="font-hud text-xs" style={{ color: hoveredAttr === key ? ATTR_COLOR[key] : 'rgba(0,212,255,0.5)' }}>{label}</span>
                  {hoveredAttr === key && (
                    <span className="text-xs" style={{ color: 'rgba(224,240,255,0.5)' }}>— {ATTR_DESC[key]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
