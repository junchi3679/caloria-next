import { useState } from 'react'
import { useGameStore, GACHA_CHARS, PULL_COST_1, PULL_COST_10 } from '../../store/gameStore'
import type { GachaResult, Weapon, Character } from '../../types'

const ATTR_COLOR: Record<string, string> = {
  arc: '#00d4ff', plasma: '#ff4466', bio: '#44ff88', cryo: '#44aaff', cyber: '#aa44ff',
}
const TYPE_LABEL: Record<string, string> = {
  blade: '검', gun: '총', staff: '지팡이', bow: '활', gauntlet: '건틀릿',
}

function StarRow({ n }: { n: number }) {
  const color = n === 4 ? '#ffd700' : '#aaa'
  return (
    <span style={{ color, fontSize: '0.75rem', letterSpacing: 1 }}>
      {'★'.repeat(n)}
    </span>
  )
}

function ResultCard({ r }: { r: GachaResult }) {
  if (r.type === 'weapon') {
    const w = r.item as Weapon
    const rarityColor = w.rarity === 4 ? '#ffd700' : '#aaaaaa'
    return (
      <div
        className="flex flex-col items-center p-3 gap-1"
        style={{
          background: `${rarityColor}12`,
          border: `1px solid ${rarityColor}50`,
          minWidth: 100,
          flex: '1 1 0',
        }}
      >
        <StarRow n={w.rarity} />
        <div className="font-hud text-xs text-center mt-1" style={{ color: rarityColor }}>
          {w.name}
        </div>
        <div className="text-xs" style={{ color: 'rgba(224,240,255,0.5)' }}>
          {TYPE_LABEL[w.type]} · ATK {w.atk}
        </div>
      </div>
    )
  }

  const c = r.item as Character
  const color = ATTR_COLOR[c.attribute] ?? '#00d4ff'
  return (
    <div
      className="flex flex-col items-center p-3 gap-1"
      style={{
        background: r.isNew ? `${color}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${r.isNew ? color : 'rgba(255,255,255,0.1)'}60`,
        minWidth: 100,
        flex: '1 1 0',
      }}
    >
      <div className="font-hud text-xs" style={{ color }}>
        {r.isNew ? '★ NEW' : '중복'}
      </div>
      <div className="font-hud text-xs text-center mt-1" style={{ color: r.isNew ? color : 'rgba(224,240,255,0.5)' }}>
        {c.name}
      </div>
      {!r.isNew && (
        <div className="text-xs" style={{ color: 'rgba(0,212,255,0.5)' }}>+{r.crystalComp} ◈</div>
      )}
    </div>
  )
}

export default function GachaScreen() {
  const { setScreen, crystals, pull, unlockedCharacters } = useGameStore()
  const [tab, setTab] = useState<'char' | 'weapon'>('char')
  const [pulling, setPulling] = useState(false)
  const [results, setResults] = useState<GachaResult[] | null>(null)

  async function handlePull(count: 1 | 10) {
    setPulling(true)
    setResults(null)
    await new Promise((r) => setTimeout(r, 600))
    const res = pull(tab === 'char' ? 'char' : 'weapon', count)
    setResults(res)
    setPulling(false)
  }

  const cost1 = PULL_COST_1
  const cost10 = PULL_COST_10

  return (
    <div className="fixed inset-0 scanline flex flex-col" style={{ background: 'var(--sf-bg)' }}>
      {/* 배경 그리드 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(170,68,255,0.08) 0%, transparent 70%)',
        }}
      />

      {/* 헤더 */}
      <div className="relative z-10 px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <div className="font-hud text-xs mb-1" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.2em' }}>
            CALORIA · PORTAL
          </div>
          <h1 className="font-hud text-3xl text-glow" style={{ letterSpacing: '0.05em' }}>SUMMON</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* 크리스탈 */}
          <div className="sf-panel px-4 py-2 flex items-center gap-2">
            <span style={{ color: '#aa44ff', fontSize: '1rem' }}>◈</span>
            <span className="font-hud text-lg" style={{ color: '#cc88ff' }}>{crystals.toLocaleString()}</span>
          </div>
          <button
            className="font-hud text-xs px-4 py-2 transition-colors"
            style={{ border: '1px solid rgba(0,212,255,0.3)', color: 'rgba(0,212,255,0.6)', cursor: 'pointer' }}
            onClick={() => setScreen('character_select')}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sf-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(0,212,255,0.6)' }}
          >
            ← 뒤로
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="relative z-10 px-8 mb-4 flex gap-2">
        {(['char', 'weapon'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setResults(null) }}
            className="font-hud text-xs px-5 py-2"
            style={{
              border: `1px solid ${tab === t ? 'rgba(170,68,255,0.7)' : 'rgba(0,212,255,0.2)'}`,
              background: tab === t ? 'rgba(170,68,255,0.12)' : 'transparent',
              color: tab === t ? '#cc88ff' : 'rgba(0,212,255,0.5)',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            {t === 'char' ? '요원 소환' : '무기 소환'}
          </button>
        ))}
      </div>

      <div className="relative z-10 flex flex-1 gap-6 px-8 pb-8 overflow-hidden">

        {/* 왼쪽: 풀 목록 */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          {tab === 'char' ? (
            <>
              <div className="font-hud text-xs mb-1" style={{ color: 'rgba(170,68,255,0.6)', letterSpacing: '0.15em' }}>
                SUMMON POOL — 요원 ({GACHA_CHARS.length})
              </div>
              {GACHA_CHARS.map((c) => {
                const locked = !unlockedCharacters.includes(c.id)
                const color = ATTR_COLOR[c.attribute]
                return (
                  <div
                    key={c.id}
                    className="sf-panel p-3"
                    style={{ opacity: locked ? 1 : 0.55, border: `1px solid ${locked ? color : 'rgba(0,212,255,0.15)'}40` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5" style={{ background: color }} />
                      <span className="font-hud text-sm" style={{ color }}>{c.name}</span>
                      {!locked && (
                        <span className="font-hud text-xs ml-auto" style={{ color: '#00ff88' }}>보유 중</span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(224,240,255,0.5)' }}>{c.exercise}</div>
                  </div>
                )
              })}
            </>
          ) : (
            <>
              <div className="font-hud text-xs mb-1" style={{ color: 'rgba(170,68,255,0.6)', letterSpacing: '0.15em' }}>
                SUMMON POOL — 무기
              </div>
              <div className="sf-panel p-3">
                <div className="font-hud text-xs mb-2" style={{ color: '#ffd700' }}>★★★★ 4성 (15%)</div>
                <div className="font-hud text-xs mb-2" style={{ color: '#aaaaaa' }}>★★★ 3성 (85%)</div>
                <div className="text-xs" style={{ color: 'rgba(224,240,255,0.4)' }}>검 · 총 · 지팡이 · 활 · 건틀릿</div>
              </div>
            </>
          )}
        </div>

        {/* 오른쪽: 소환 패널 */}
        <div className="flex-1 flex flex-col gap-4">
          {/* 결과 영역 */}
          <div
            className="sf-panel flex-1 p-5 flex flex-col items-center justify-center"
            style={{ minHeight: 200 }}
          >
            {pulling && (
              <div className="text-center">
                <div className="font-hud text-2xl pulse mb-3" style={{ color: '#aa44ff' }}>◈</div>
                <div className="font-hud text-sm" style={{ color: 'rgba(170,68,255,0.7)', letterSpacing: '0.15em' }}>
                  소환 중...
                </div>
              </div>
            )}

            {!pulling && !results && (
              <div className="text-center">
                <div className="font-hud text-4xl mb-3" style={{ color: 'rgba(170,68,255,0.15)' }}>◈</div>
                <div className="font-hud text-sm" style={{ color: 'rgba(170,68,255,0.3)', letterSpacing: '0.1em' }}>
                  소환 버튼을 눌러주세요
                </div>
              </div>
            )}

            {!pulling && results && (
              <div className="w-full">
                <div className="font-hud text-xs mb-4 text-center" style={{ color: 'rgba(170,68,255,0.6)', letterSpacing: '0.15em' }}>
                  ── 소환 결과 ──
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {results.map((r, i) => <ResultCard key={i} r={r} />)}
                </div>
                {results.some((r) => r.crystalComp > 0) && (
                  <div className="font-hud text-xs mt-4 text-center" style={{ color: '#cc88ff' }}>
                    중복 보상 +{results.reduce((a, r) => a + r.crystalComp, 0)} ◈ 지급됨
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 소환 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => handlePull(1)}
              disabled={pulling || crystals < cost1}
              className="flex-1 py-4 font-hud text-sm transition-all"
              style={{
                border: `1px solid ${crystals >= cost1 ? '#aa44ff' : 'rgba(170,68,255,0.2)'}`,
                background: crystals >= cost1 ? 'rgba(170,68,255,0.12)' : 'transparent',
                color: crystals >= cost1 ? '#cc88ff' : 'rgba(170,68,255,0.3)',
                cursor: crystals >= cost1 ? 'pointer' : 'not-allowed',
                letterSpacing: '0.1em',
                opacity: pulling ? 0.5 : 1,
              }}
            >
              × 1 소환 — {cost1} ◈
            </button>
            <button
              onClick={() => handlePull(10)}
              disabled={pulling || crystals < cost10}
              className="flex-1 py-4 font-hud text-sm transition-all"
              style={{
                border: `1px solid ${crystals >= cost10 ? '#ffd700' : 'rgba(255,215,0,0.2)'}`,
                background: crystals >= cost10 ? 'rgba(255,215,0,0.08)' : 'transparent',
                color: crystals >= cost10 ? '#ffd700' : 'rgba(255,215,0,0.3)',
                cursor: crystals >= cost10 ? 'pointer' : 'not-allowed',
                letterSpacing: '0.1em',
                opacity: pulling ? 0.5 : 1,
              }}
            >
              ×10 소환 — {cost10} ◈
            </button>
          </div>

          <div className="font-hud text-xs text-center" style={{ color: 'rgba(0,212,255,0.25)' }}>
            ◈ 크리스탈은 몬스터 처치로 획득 · 중복 요원 소환 시 40 ◈ 반환
          </div>
        </div>
      </div>
    </div>
  )
}
