import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { CharacterId, Character } from '../../types'

const ATTR_LABEL: Record<string, string> = {
  arc: 'ARC', plasma: 'PLASMA', bio: 'BIO', cryo: 'CRYO', cyber: 'CYBER',
}
const ATTR_COLOR: Record<string, string> = {
  arc: '#00d4ff', plasma: '#ff4466', bio: '#44ff88', cryo: '#44aaff', cyber: '#aa44ff',
}
const ATTR_DESC: Record<string, string> = {
  arc:    '스피드 / 달리기 / 파쿠르',
  plasma: '파워 / 근력 / 웨이트',
  bio:    '유연성 / 요가 / 회복',
  cryo:   '지구력 / 유산소 / HIIT',
  cyber:  '균형 / 코어 / 정밀',
}

function AttrBadge({ attr }: { attr: string }) {
  const color = ATTR_COLOR[attr]
  return (
    <span
      className="font-hud text-xs px-2 py-0.5"
      style={{ border: `1px solid ${color}50`, color, background: `${color}15` }}
    >
      {ATTR_LABEL[attr]}
    </span>
  )
}

function CharCard({ char, selected, onClick }: { char: Character; selected: boolean; onClick: () => void }) {
  const color = ATTR_COLOR[char.attribute]
  return (
    <button
      onClick={onClick}
      className="relative text-left transition-all duration-200 w-full"
      style={{
        background: selected ? `${color}18` : 'rgba(0,20,40,0.7)',
        border: `1px solid ${selected ? color : 'rgba(0,212,255,0.15)'}`,
        boxShadow: selected ? `0 0 20px ${color}40` : 'none',
        padding: '14px 16px',
        cursor: 'pointer',
      }}
    >
      {/* 선택 표시 코너 */}
      {selected && (
        <>
          <span style={{ position:'absolute', top:-1, left:-1, width:8, height:8, borderTop:`2px solid ${color}`, borderLeft:`2px solid ${color}` }} />
          <span style={{ position:'absolute', bottom:-1, right:-1, width:8, height:8, borderBottom:`2px solid ${color}`, borderRight:`2px solid ${color}` }} />
        </>
      )}

      <div className="flex items-start gap-3">
        {/* 속성 색상 바 */}
        <div className="flex-shrink-0 w-1 self-stretch rounded-none" style={{ background: color, opacity: selected ? 1 : 0.3 }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-hud text-sm"
              style={{ color: selected ? color : '#c0d8f0' }}
            >
              {char.name}
            </span>
            <AttrBadge attr={char.attribute} />
          </div>
          <div className="text-xs mb-1" style={{ color: 'rgba(0,212,255,0.5)' }}>
            {char.exercise}
          </div>
          {selected && (
            <div className="text-xs leading-snug mt-1" style={{ color: 'rgba(224,240,255,0.7)' }}>
              {char.description}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export default function CharacterSelect() {
  const { characters, selectedCharacter, selectCharacter, setScreen } = useGameStore()
  const [hoveredAttr, setHoveredAttr] = useState<string | null>(null)

  const protagonist = characters.filter((c) => c.id === 'ian_m' || c.id === 'ian_f')
  const companions = characters.filter((c) => c.id !== 'ian_m' && c.id !== 'ian_f')

  const selected = characters.find((c) => c.id === selectedCharacter)

  function handleConfirm() {
    if (selectedCharacter) setScreen('game')
  }

  return (
    <div className="fixed inset-0 scanline flex flex-col" style={{ background: 'var(--sf-bg)' }}>
      {/* 배경 그리드 */}
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
        <h1 className="font-hud text-3xl text-glow" style={{ letterSpacing: '0.05em' }}>
          SELECT OPERATIVE
        </h1>
        <div className="text-sm mt-1" style={{ color: 'rgba(224,240,255,0.5)' }}>
          탐험을 함께할 요원을 선택하세요
        </div>
      </div>

      <div className="relative z-10 flex flex-1 gap-6 px-8 pb-8 overflow-hidden">

        {/* 좌측: 캐릭터 목록 */}
        <div className="flex flex-col gap-4 w-80 flex-shrink-0 overflow-y-auto">

          {/* 주인공 */}
          <div>
            <div className="font-hud text-xs mb-2 px-1" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>
              ── PROTAGONIST ──
            </div>
            <div className="flex flex-col gap-2">
              {protagonist.map((c) => (
                <CharCard
                  key={c.id}
                  char={c}
                  selected={selectedCharacter === c.id}
                  onClick={() => selectCharacter(c.id as CharacterId)}
                />
              ))}
            </div>
          </div>

          {/* 동료 */}
          <div>
            <div className="font-hud text-xs mb-2 px-1" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>
              ── COMPANIONS ──
            </div>
            <div className="flex flex-col gap-2">
              {companions.map((c) => (
                <CharCard
                  key={c.id}
                  char={c}
                  selected={selectedCharacter === c.id}
                  onClick={() => selectCharacter(c.id as CharacterId)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 우측: 상세 패널 */}
        <div className="flex-1 flex flex-col gap-4">

          {/* 캐릭터 상세 */}
          <div className="sf-panel flex-1 p-6 holo-flicker">
            {selected ? (
              <div className="h-full flex flex-col">
                {/* 이름 & 속성 */}
                <div className="flex items-start gap-4 mb-6">
                  {/* 속성 색상 아이콘 */}
                  <div
                    className="w-14 h-14 flex items-center justify-center flex-shrink-0"
                    style={{ border: `1px solid ${ATTR_COLOR[selected.attribute]}50`, background: `${ATTR_COLOR[selected.attribute]}10` }}
                  >
                    <span className="font-hud text-xs text-center" style={{ color: ATTR_COLOR[selected.attribute] }}>
                      {ATTR_LABEL[selected.attribute]}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-hud text-2xl mb-1" style={{ color: ATTR_COLOR[selected.attribute] }}>
                      {selected.name}
                    </h2>
                    <div className="text-sm" style={{ color: 'rgba(0,212,255,0.6)' }}>
                      {ATTR_DESC[selected.attribute]}
                    </div>
                  </div>
                </div>

                {/* 구분선 */}
                <div className="mb-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.15)' }} />

                {/* 서사 */}
                <div className="mb-6">
                  <div className="font-hud text-xs mb-2" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>
                    BACKGROUND
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(224,240,255,0.8)' }}>
                    {selected.description}
                  </p>
                </div>

                {/* 속성 설명 */}
                <div className="mb-6">
                  <div className="font-hud text-xs mb-3" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>
                    ATTRIBUTE
                  </div>
                  <div
                    className="p-3 text-sm"
                    style={{ background: `${ATTR_COLOR[selected.attribute]}08`, border: `1px solid ${ATTR_COLOR[selected.attribute]}25` }}
                  >
                    <span style={{ color: ATTR_COLOR[selected.attribute] }}>
                      {ATTR_LABEL[selected.attribute]}
                    </span>
                    <span className="mx-2" style={{ color: 'rgba(0,212,255,0.3)' }}>|</span>
                    <span style={{ color: 'rgba(224,240,255,0.7)' }}>
                      {ATTR_DESC[selected.attribute]}
                    </span>
                  </div>
                </div>

                <div className="flex-1" />

                {/* 확인 버튼 */}
                <button
                  className="sf-btn-accent w-full py-3 text-sm"
                  style={{
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '0.75rem',
                    letterSpacing: '0.15em',
                    border: `1px solid ${ATTR_COLOR[selected.attribute]}`,
                    color: ATTR_COLOR[selected.attribute],
                    background: `${ATTR_COLOR[selected.attribute]}10`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={handleConfirm}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${ATTR_COLOR[selected.attribute]}25` }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${ATTR_COLOR[selected.attribute]}10` }}
                >
                  DEPLOY — {selected.name}
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="font-hud text-4xl mb-4 pulse" style={{ color: 'rgba(0,212,255,0.2)' }}>◈</div>
                  <div className="font-hud text-sm" style={{ color: 'rgba(0,212,255,0.3)', letterSpacing: '0.15em' }}>
                    SELECT AN OPERATIVE
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 하단 속성 레전드 */}
          <div className="sf-panel p-4">
            <div className="font-hud text-xs mb-3" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>
              ATTRIBUTE LEGEND
            </div>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(ATTR_LABEL).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 cursor-default"
                  onMouseEnter={() => setHoveredAttr(key)}
                  onMouseLeave={() => setHoveredAttr(null)}
                >
                  <div className="w-2 h-2" style={{ background: ATTR_COLOR[key] }} />
                  <span className="font-hud text-xs" style={{ color: hoveredAttr === key ? ATTR_COLOR[key] : 'rgba(0,212,255,0.5)' }}>
                    {label}
                  </span>
                  {hoveredAttr === key && (
                    <span className="text-xs" style={{ color: 'rgba(224,240,255,0.5)' }}>
                      — {ATTR_DESC[key]}
                    </span>
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
