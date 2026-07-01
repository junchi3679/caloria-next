import { useState } from 'react'
import { useGameStore, GACHA_CHARS, LIMITED_CHARS, FEATURED_CHAR, PULL_COST_1, PULL_COST_10, EXCHANGE_RATES, WEAPONS_3STAR, WEAPON_SHOP_PRICE } from '../../store/gameStore'
import type { GachaResult, Weapon, Character, Accessory, AccessoryStat } from '../../types'

const ATTR_COLOR: Record<string, string> = {
  arc: '#00d4ff', plasma: '#ff4466', bio: '#44ff88', cryo: '#44aaff', cyber: '#aa44ff',
}
const TYPE_LABEL: Record<string, string> = {
  blade: '검', gun: '총', staff: '지팡이', bow: '활', gauntlet: '건틀릿',
}
const STAT_LABEL: Record<AccessoryStat, string> = {
  critRate: '치명타 확률', critDmg: '치명타 피해', atk: '공격력',
  def: '방어력', hp: 'HP', skillSpeed: '스킬 속도', moveSpeed: '이동 속도',
}
const STAT_UNIT: Record<AccessoryStat, string> = {
  critRate: '%', critDmg: '%', atk: '', def: '', hp: '', skillSpeed: '%', moveSpeed: '%',
}

function ResultCard({ r }: { r: GachaResult }) {
  if (r.type === 'weapon') {
    const w = r.item as Weapon
    const rc = w.rarity === 4 ? '#ffd700' : '#aaaaaa'
    return (
      <div className="flex flex-col items-center p-3 gap-1" style={{ background: `${rc}12`, border: `1px solid ${rc}50`, minWidth: 100, flex: '1 1 0' }}>
        <span style={{ color: rc, fontSize: '0.75rem' }}>{'★'.repeat(w.rarity)}</span>
        <div className="font-hud text-xs text-center mt-1" style={{ color: rc }}>{w.name}</div>
        <div className="text-xs" style={{ color: 'rgba(224,240,255,0.5)' }}>{TYPE_LABEL[w.type]} · ATK {w.atk}</div>
      </div>
    )
  }
  if (r.type === 'accessory') {
    const acc = r.item as Accessory
    const rc = acc.rarity === 5 ? '#ffe066' : '#ffd700'
    return (
      <div className="flex flex-col items-center p-3 gap-1" style={{ background: `${rc}12`, border: `1px solid ${rc}60`, minWidth: 110, flex: '1 1 0', position: 'relative' }}>
        <div className="font-hud absolute" style={{ top: 4, right: 6, fontSize: '0.5rem', color: '#00ff88' }}>BONUS</div>
        <span style={{ color: rc, fontSize: '0.75rem' }}>{'★'.repeat(acc.rarity)}</span>
        <div className="font-hud text-xs text-center mt-1" style={{ color: rc }}>{acc.name}</div>
        <div className="flex flex-col gap-0.5 mt-1 w-full">
          {acc.stats.map((s, i) => (
            <div key={i} className="font-hud text-center" style={{ fontSize: '0.58rem', color: `${rc}cc` }}>
              {STAT_LABEL[s.stat]} +{s.value}{STAT_UNIT[s.stat]}
            </div>
          ))}
        </div>
      </div>
    )
  }
  const c = r.item as Character
  const color = ATTR_COLOR[c.attribute] ?? '#00d4ff'
  const isLimited = c.unlockType === 'limited'
  return (
    <div className="flex flex-col items-center p-3 gap-1" style={{ background: r.isNew ? `${color}18` : 'rgba(170,68,255,0.08)', border: `1px solid ${r.isNew ? color : '#aa44ff'}60`, minWidth: 100, flex: '1 1 0', position: 'relative' }}>
      {isLimited && r.isNew && (
        <div className="font-hud absolute" style={{ top: 4, left: 6, fontSize: '0.5rem', color: '#ffcc00', letterSpacing: '0.06em' }}>LIMITED</div>
      )}
      <div className="font-hud text-xs" style={{ color: r.isNew ? color : '#cc88ff' }}>{r.isNew ? '★ NEW' : '중복'}</div>
      <div className="font-hud text-xs text-center mt-1" style={{ color: r.isNew ? color : 'rgba(224,240,255,0.5)' }}>{c.name}</div>
      {!r.isNew && <div className="font-hud text-xs mt-0.5" style={{ color: '#cc88ff' }}>파편 +{r.shardComp} 🔷</div>}
    </div>
  )
}

const TYPE_ICON: Record<string, string> = { blade: '🗡', gun: '🔫', staff: '🪄', bow: '🏹', gauntlet: '🥊' }

function ExchangeTab() {
  const { shards, crystals, limitedCrystals, gold, standardTickets, limitedTickets, exchangeShards, buyTickets, buyWeapon3 } = useGameStore()
  const [msg, setMsg] = useState('')

  function doExchange(to: 'gold' | 'weapon3' | 'expItem') {
    const ok = exchangeShards(to)
    const MSG: Record<string, string> = {
      gold: `🪙 ${EXCHANGE_RATES.shardsToGold.gold} 골드 교환 완료!`,
      weapon3: '⚔ 3성 무기 교환 완료!',
      expItem: `🧪 파편 압축 코어 (EXP +${EXCHANGE_RATES.shardsToExpItem.expValue}) 교환 완료!`,
    }
    setMsg(ok ? MSG[to] : '파편이 부족합니다.')
    setTimeout(() => setMsg(''), 2500)
  }

  function doBuyTickets(banner: 'standard' | 'limited', count: 1 | 10) {
    const ok = buyTickets(banner, count)
    if (ok) {
      const label = banner === 'standard' ? '상시 뽑기권' : '한정 뽑기권'
      setMsg(`🎫 ${label} ${count}장 구매 완료!`)
    } else {
      setMsg(banner === 'standard' ? '크리스탈이 부족합니다.' : '별조각이 부족합니다.')
    }
    setTimeout(() => setMsg(''), 2500)
  }

  const ticketRows: Array<{
    banner: 'standard' | 'limited'
    label: string
    icon: string
    cur: number
    curLabel: string
    curColor: string
    ticketCount: number
    borderColor: string
  }> = [
    {
      banner: 'standard', label: '상시 뽑기권', icon: '🎫',
      cur: crystals, curLabel: '◈', curColor: '#cc88ff',
      ticketCount: standardTickets, borderColor: '#cc88ff',
    },
    {
      banner: 'limited', label: '한정 뽑기권', icon: '🎟',
      cur: limitedCrystals, curLabel: '★', curColor: '#ffcc00',
      ticketCount: limitedTickets, borderColor: '#ffcc00',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="sf-panel p-4 flex flex-col gap-2">
        <div className="font-hud text-xs mb-2" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>현재 보유 재화</div>
        <div className="flex gap-4 flex-wrap">
          {[
            { label: '크리스탈', value: `◈ ${crystals}`, color: '#cc88ff' },
            { label: '별조각', value: `★ ${limitedCrystals}`, color: '#ffcc00' },
            { label: '골드', value: `🪙 ${gold}`, color: '#ffd700' },
            { label: '파편', value: `🔷 ${shards}`, color: '#aa88ff' },
            { label: '상시 뽑기권', value: `🎫 ${standardTickets}`, color: '#cc88ff' },
            { label: '한정 뽑기권', value: `🎟 ${limitedTickets}`, color: '#ffcc00' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="font-hud" style={{ fontSize: '0.55rem', color: 'rgba(224,240,255,0.35)' }}>{label}</div>
              <div className="font-hud text-base" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 뽑기권 구매 */}
      <div className="sf-panel p-4 flex flex-col gap-3">
        <div className="font-hud text-xs mb-1" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>재화 → 뽑기권</div>
        {ticketRows.map(({ banner, label, icon, cur, curLabel, curColor, ticketCount, borderColor }) => {
          const can1 = cur >= PULL_COST_1
          const can10 = cur >= PULL_COST_10
          return (
            <div key={banner} className="flex items-center justify-between p-3 gap-3" style={{ border: `1px solid ${borderColor}25`, background: `${borderColor}06` }}>
              <div className="flex-1">
                <div className="font-hud text-sm" style={{ color: borderColor }}>{icon} {label}</div>
                <div className="font-hud text-xs mt-0.5" style={{ color: 'rgba(224,240,255,0.35)' }}>
                  {curLabel} {PULL_COST_1} / 1장 · {curLabel} {PULL_COST_10} / 10장 &nbsp;
                  <span style={{ color: `${curColor}aa` }}>보유: {curLabel} {cur} · {icon} {ticketCount}장</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => doBuyTickets(banner, 1)} disabled={!can1} className="font-hud text-sm px-3 py-1.5"
                  style={{ border: `1px solid ${can1 ? borderColor : `${borderColor}30`}`, color: can1 ? borderColor : `${borderColor}40`, cursor: can1 ? 'pointer' : 'not-allowed', background: can1 ? `${borderColor}12` : 'transparent' }}>
                  1장
                </button>
                <button onClick={() => doBuyTickets(banner, 10)} disabled={!can10} className="font-hud text-sm px-3 py-1.5"
                  style={{ border: `1px solid ${can10 ? borderColor : `${borderColor}30`}`, color: can10 ? borderColor : `${borderColor}40`, cursor: can10 ? 'pointer' : 'not-allowed', background: can10 ? `${borderColor}12` : 'transparent' }}>
                  10장
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 파편 교환 */}
      <div className="sf-panel p-4 flex flex-col gap-3">
        <div className="font-hud text-xs mb-1" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>파편 교환</div>
        {([
          { to: 'gold' as const,      label: '파편 → 골드',        desc: `🔷 ${EXCHANGE_RATES.shardsToGold.shards} → 🪙 ${EXCHANGE_RATES.shardsToGold.gold}`,                    border: '#ffd700', enough: shards >= EXCHANGE_RATES.shardsToGold.shards },
          { to: 'weapon3' as const,   label: '파편 → 3성 무기',    desc: `🔷 ${EXCHANGE_RATES.shardsToWeapon3.shards} → ⚔ 3★ 무기 (랜덤)`,                                       border: '#aaaaaa', enough: shards >= EXCHANGE_RATES.shardsToWeapon3.shards },
          { to: 'expItem' as const,   label: '파편 → EXP 아이템',  desc: `🔷 ${EXCHANGE_RATES.shardsToExpItem.shards} → 🧪 압축 코어 (EXP +${EXCHANGE_RATES.shardsToExpItem.expValue})`, border: '#00d4ff', enough: shards >= EXCHANGE_RATES.shardsToExpItem.shards },
        ] as const).map(({ to, label, desc, border, enough }) => (
          <div key={to} className="flex items-center justify-between p-3" style={{ border: `1px solid ${border}22`, background: `${border}06` }}>
            <div>
              <div className="font-hud text-sm" style={{ color: enough ? border : `${border}55` }}>{label}</div>
              <div className="font-hud text-xs mt-0.5" style={{ color: 'rgba(224,240,255,0.4)' }}>{desc}</div>
            </div>
            <button onClick={() => doExchange(to)} disabled={!enough} className="font-hud text-sm px-4 py-2"
              style={{ border: `1px solid ${enough ? border : `${border}30`}`, color: enough ? border : `${border}40`, cursor: enough ? 'pointer' : 'not-allowed', background: enough ? `${border}12` : 'transparent' }}>
              교환
            </button>
          </div>
        ))}
      </div>

      {/* 3성 무기 직구 */}
      <div className="sf-panel p-4 flex flex-col gap-3">
        <div className="flex items-baseline gap-2 mb-1">
          <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>3성 무기 직구</div>
          <div className="font-hud" style={{ fontSize: '0.6rem', color: '#aa88ff' }}>🔷 {WEAPON_SHOP_PRICE} / 1개</div>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
          {WEAPONS_3STAR.map((w) => {
            const canBuy = shards >= WEAPON_SHOP_PRICE
            return (
              <div key={w.id} className="flex flex-col gap-1.5 p-3"
                style={{ border: '1px solid rgba(170,170,170,0.2)', background: 'rgba(170,170,170,0.04)' }}>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: '0.85rem' }}>{TYPE_ICON[w.type]}</span>
                  <div className="font-hud text-xs flex-1 truncate" style={{ color: '#cccccc' }}>{w.name}</div>
                </div>
                <div className="font-hud" style={{ fontSize: '0.58rem', color: 'rgba(224,240,255,0.35)' }}>
                  {'★'.repeat(w.rarity)} · ATK {w.atk}
                </div>
                <button
                  onClick={() => {
                    const ok = buyWeapon3(w.id)
                    setMsg(ok ? `⚔ ${w.name} 구매 완료!` : '파편이 부족합니다.')
                    setTimeout(() => setMsg(''), 2000)
                  }}
                  disabled={!canBuy}
                  className="font-hud text-sm py-1.5 mt-0.5"
                  style={{
                    border: `1px solid ${canBuy ? '#aa88ff50' : 'rgba(255,255,255,0.08)'}`,
                    color: canBuy ? '#aa88ff' : 'rgba(255,255,255,0.2)',
                    background: canBuy ? 'rgba(100,80,255,0.08)' : 'transparent',
                    cursor: canBuy ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.06em',
                  }}
                >
                  🔷 {WEAPON_SHOP_PRICE}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {msg && (
        <div className="font-hud text-sm text-center py-2" style={{ color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.06)' }}>
          {msg}
        </div>
      )}
    </div>
  )
}

// ── 상시 / 한정 소환 탭 ───────────────────────────────────
function SummonTab({ banner }: { banner: 'standard' | 'limited' }) {
  const { crystals, limitedCrystals, standardTickets, limitedTickets, pull, unlockedCharacters } = useGameStore()
  const [tab, setTab] = useState<'char' | 'weapon'>('char')
  const [pulling, setPulling] = useState(false)
  const [results, setResults] = useState<GachaResult[] | null>(null)

  const currency = banner === 'limited' ? limitedCrystals : crystals
  const tickets = banner === 'limited' ? limitedTickets : standardTickets
  const currencyLabel = banner === 'limited' ? '★' : '◈'
  const currencyColor = banner === 'limited' ? '#ffcc00' : '#cc88ff'
  const ticketLabel = banner === 'limited' ? '🎟 한정권' : '🎫 상시권'
  const featuredChar = banner === 'limited' ? LIMITED_CHARS.find((c) => c.id === FEATURED_CHAR) : null
  const availableTabs: Array<'char' | 'weapon'> = banner === 'limited' ? ['char'] : ['char', 'weapon']

  async function handlePull(count: 1 | 10, payWith: 'currency' | 'ticket') {
    setPulling(true)
    setResults(null)
    await new Promise((r) => setTimeout(r, 600))
    const res = pull(tab, count, banner, payWith)
    setResults(res)
    setPulling(false)
  }

  return (
    <div className="flex flex-1 gap-6 overflow-hidden">
      {/* 왼쪽: 풀 정보 */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">

        {/* 한정 배너 피처드 */}
        {banner === 'limited' && featuredChar && (
          <div className="p-4 flex flex-col gap-2" style={{ border: `1px solid ${ATTR_COLOR[featuredChar.attribute]}60`, background: `${ATTR_COLOR[featuredChar.attribute]}0c`, position: 'relative', overflow: 'hidden' }}>
            <div className="absolute top-2 right-3 font-hud" style={{ fontSize: '0.55rem', color: '#ffcc00', letterSpacing: '0.12em' }}>FEATURED</div>
            <div className="font-hud text-xs" style={{ color: '#ffcc00', letterSpacing: '0.15em' }}>★ 한정 픽업</div>
            <div className="font-hud text-2xl" style={{ color: ATTR_COLOR[featuredChar.attribute] }}>{featuredChar.name}</div>
            <div className="text-xs" style={{ color: 'rgba(224,240,255,0.5)' }}>{featuredChar.exercise}</div>
            <div className="text-xs leading-snug" style={{ color: 'rgba(224,240,255,0.65)' }}>{featuredChar.description}</div>
            <div className="font-hud text-xs mt-1 px-2 py-1 inline-block self-start" style={{ border: '1px solid #ffcc0050', color: '#ffcc00', background: '#ffcc0012' }}>
              픽업 확률 50%
            </div>
            {unlockedCharacters.includes(FEATURED_CHAR) && (
              <div className="font-hud text-xs mt-1" style={{ color: '#00ff88' }}>✓ 보유 중</div>
            )}
          </div>
        )}

        {/* 한정 배너 전체 풀 */}
        {banner === 'limited' && (
          <>
            <div className="sf-panel p-3">
              <div className="font-hud text-xs mb-2" style={{ color: 'rgba(170,68,255,0.6)', letterSpacing: '0.15em' }}>한정 POOL</div>
              {LIMITED_CHARS.map((c) => {
                const color = ATTR_COLOR[c.attribute]
                const owned = unlockedCharacters.includes(c.id)
                const isFeat = c.id === FEATURED_CHAR
                return (
                  <div key={c.id} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(0,212,255,0.07)' }}>
                    <div className="w-1.5 h-1.5 flex-shrink-0" style={{ background: color }} />
                    <span className="font-hud text-xs flex-1" style={{ color }}>{c.name}</span>
                    {isFeat && <span className="font-hud" style={{ fontSize: '0.5rem', color: '#ffcc00' }}>FEAT</span>}
                    {owned && <span className="font-hud" style={{ fontSize: '0.5rem', color: '#00ff88' }}>보유</span>}
                  </div>
                )
              })}
            </div>
            <div className="sf-panel p-2.5" style={{ border: '1px solid rgba(255,224,102,0.2)', background: 'rgba(255,224,102,0.04)' }}>
              <div className="font-hud" style={{ fontSize: '0.6rem', color: 'rgba(255,224,102,0.6)' }}>✦ 15% 확률로 잡템 추가 드롭</div>
            </div>
          </>
        )}

        {/* 상시 배너 탭 선택 */}
        {banner === 'standard' && (
          <div className="flex gap-2">
            {availableTabs.map((t) => (
              <button key={t} onClick={() => { setTab(t); setResults(null) }} className="flex-1 font-hud text-sm py-2.5"
                style={{ border: `1px solid ${tab === t ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.15)'}`, background: tab === t ? 'rgba(0,212,255,0.08)' : 'transparent', color: tab === t ? '#00d4ff' : 'rgba(0,212,255,0.4)', cursor: 'pointer' }}>
                {t === 'char' ? '요원' : '무기'}
              </button>
            ))}
          </div>
        )}

        {/* 상시 요원 풀 */}
        {banner === 'standard' && tab === 'char' && (
          <>
            <div className="font-hud text-xs" style={{ color: 'rgba(170,68,255,0.6)', letterSpacing: '0.15em' }}>요원 POOL ({GACHA_CHARS.length})</div>
            {GACHA_CHARS.map((c) => {
              const color = ATTR_COLOR[c.attribute]
              const locked = !unlockedCharacters.includes(c.id)
              return (
                <div key={c.id} className="sf-panel p-3" style={{ opacity: locked ? 1 : 0.55, border: `1px solid ${locked ? color : 'rgba(0,212,255,0.15)'}30` }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-1.5 h-1.5" style={{ background: color }} />
                    <span className="font-hud text-sm" style={{ color }}>{c.name}</span>
                    {!locked && <span className="font-hud text-xs ml-auto" style={{ color: '#00ff88' }}>보유 중</span>}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(224,240,255,0.45)' }}>{c.exercise}</div>
                </div>
              )
            })}
            <div className="sf-panel p-2.5" style={{ border: '1px solid rgba(255,224,102,0.2)', background: 'rgba(255,224,102,0.04)' }}>
              <div className="font-hud" style={{ fontSize: '0.6rem', color: 'rgba(255,224,102,0.6)' }}>✦ 15% 확률로 잡템 추가 드롭</div>
            </div>
          </>
        )}

        {/* 상시 무기 풀 */}
        {banner === 'standard' && tab === 'weapon' && (
          <>
            <div className="font-hud text-xs" style={{ color: 'rgba(170,68,255,0.6)', letterSpacing: '0.15em' }}>무기 POOL</div>
            <div className="sf-panel p-3 flex flex-col gap-1.5">
              <div className="font-hud text-xs" style={{ color: '#ffd700' }}>★★★★ 4성 — 15%</div>
              <div className="font-hud text-xs" style={{ color: '#aaaaaa' }}>★★★ 3성 — 85%</div>
              <div className="text-xs mt-1" style={{ color: 'rgba(224,240,255,0.35)' }}>검 · 총 · 지팡이 · 활 · 건틀릿</div>
            </div>
            <div className="sf-panel p-2.5" style={{ border: '1px solid rgba(255,224,102,0.2)', background: 'rgba(255,224,102,0.04)' }}>
              <div className="font-hud" style={{ fontSize: '0.6rem', color: 'rgba(255,224,102,0.6)' }}>✦ 20% 확률로 잡템 추가 드롭</div>
            </div>
          </>
        )}
      </div>

      {/* 오른쪽: 소환 패널 */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="sf-panel flex-1 p-5 flex flex-col items-center justify-center" style={{ minHeight: 200 }}>
          {pulling && (
            <div className="text-center">
              <div className="font-hud text-2xl pulse mb-3" style={{ color: banner === 'limited' ? '#ffcc00' : '#aa44ff' }}>
                {banner === 'limited' ? '★' : '◈'}
              </div>
              <div className="font-hud text-sm" style={{ color: 'rgba(170,68,255,0.7)', letterSpacing: '0.15em' }}>소환 중...</div>
            </div>
          )}
          {!pulling && !results && (
            <div className="text-center">
              <div className="font-hud text-4xl mb-3" style={{ color: 'rgba(170,68,255,0.12)' }}>
                {banner === 'limited' ? '★' : '◈'}
              </div>
              <div className="font-hud text-sm" style={{ color: 'rgba(170,68,255,0.3)', letterSpacing: '0.1em' }}>소환 버튼을 눌러주세요</div>
            </div>
          )}
          {!pulling && results && (
            <div className="w-full">
              <div className="font-hud text-xs mb-4 text-center" style={{ color: 'rgba(170,68,255,0.6)', letterSpacing: '0.15em' }}>── 소환 결과 ──</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {results.map((r, i) => <ResultCard key={i} r={r} />)}
              </div>
              {results.some((r) => r.shardComp > 0) && (
                <div className="font-hud text-xs mt-3 text-center" style={{ color: '#cc88ff' }}>
                  파편 +{results.reduce((a, r) => a + r.shardComp, 0)} 🔷 지급됨
                </div>
              )}
              {results.some((r) => r.type === 'accessory') && (
                <div className="font-hud text-xs mt-1.5 text-center" style={{ color: '#ffe066' }}>
                  ✦ 잡템 {results.filter((r) => r.type === 'accessory').length}개 획득!
                </div>
              )}
            </div>
          )}
        </div>

        {/* 재화 소환 버튼 */}
        <div className="flex gap-3">
          {[1, 10].map((cnt) => {
            const cost = cnt === 1 ? PULL_COST_1 : PULL_COST_10
            const canPull = !pulling && currency >= cost
            return (
              <button key={cnt} onClick={() => handlePull(cnt as 1 | 10, 'currency')} disabled={!canPull} className="flex-1 py-3.5 font-hud text-sm transition-all"
                style={{ border: `1px solid ${canPull ? currencyColor : `${currencyColor}25`}`, background: canPull ? `${currencyColor}12` : 'transparent', color: canPull ? currencyColor : `${currencyColor}35`, cursor: canPull ? 'pointer' : 'not-allowed', letterSpacing: '0.08em', opacity: pulling ? 0.5 : 1 }}>
                ×{cnt} 소환 — {cost} {currencyLabel}
              </button>
            )
          })}
        </div>

        {/* 뽑기권 소환 버튼 */}
        <div className="flex gap-3">
          {[1, 10].map((cnt) => {
            const canTicket = !pulling && tickets >= cnt
            return (
              <button key={cnt} onClick={() => handlePull(cnt as 1 | 10, 'ticket')} disabled={!canTicket} className="flex-1 py-3.5 font-hud text-sm transition-all"
                style={{ border: `1px solid ${canTicket ? currencyColor + '88' : currencyColor + '20'}`, background: canTicket ? `${currencyColor}08` : 'transparent', color: canTicket ? `${currencyColor}cc` : `${currencyColor}28`, cursor: canTicket ? 'pointer' : 'not-allowed', letterSpacing: '0.08em', opacity: pulling ? 0.5 : 1 }}>
                {banner === 'limited' ? '🎟' : '🎫'} ×{cnt} — {ticketLabel} {cnt}장 <span style={{ opacity: 0.6 }}>(보유 {tickets})</span>
              </button>
            )
          })}
        </div>

        <div className="font-hud text-xs text-center" style={{ color: 'rgba(0,212,255,0.2)' }}>
          {banner === 'limited'
            ? `★ 한정 소환 — 별조각/한정권 소모 · 피처드 50% · 잔여 ${limitedCrystals}★ / 🎟${limitedTickets}장`
            : tab === 'weapon'
            ? `◈ 무기 소환 · 3★ 85% / 4★ 15% · 잔여 ${crystals}◈ / 🎫${standardTickets}장`
            : `◈ 요원 소환 · 중복 시 파편 40개 지급 · 잔여 ${crystals}◈ / 🎫${standardTickets}장`}
        </div>
      </div>
    </div>
  )
}

// ── 메인 화면 ─────────────────────────────────────────────
export default function GachaScreen() {
  const { goBack, crystals, limitedCrystals, standardTickets, limitedTickets } = useGameStore()
  const [mode, setMode] = useState<'standard' | 'limited' | 'exchange'>('standard')

  const MODES = [
    { key: 'standard' as const, label: '상시 소환', color: '#cc88ff' },
    { key: 'limited' as const,  label: '★ 한정 소환', color: '#ffcc00' },
    { key: 'exchange' as const, label: '교환', color: 'rgba(0,212,255,0.6)' },
  ]

  return (
    <div className="fixed inset-0 scanline flex flex-col" style={{ background: 'var(--sf-bg)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(170,68,255,0.07) 0%, transparent 70%)' }} />

      {/* 헤더 */}
      <div className="relative z-10 px-8 pt-6 pb-3 flex items-center justify-between">
        <div>
          <div className="font-hud text-xs mb-1" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.2em' }}>CALORIA · PORTAL</div>
          <h1 className="font-hud text-3xl text-glow" style={{ letterSpacing: '0.05em' }}>SUMMON</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* 재화 + 티켓 표시 */}
          <div className="sf-panel px-3 py-2 flex gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-hud text-sm" style={{ color: '#aa44ff' }}>◈</span>
              <span className="font-hud text-sm" style={{ color: '#cc88ff' }}>{crystals.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-hud text-sm" style={{ color: '#ffcc00' }}>★</span>
              <span className="font-hud text-sm" style={{ color: '#ffdd55' }}>{limitedCrystals.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem' }}>🎫</span>
              <span className="font-hud text-sm" style={{ color: '#cc88ff' }}>{standardTickets}</span>
            </div>
            <div className="flex items-center gap-1">
              <span style={{ fontSize: '0.8rem' }}>🎟</span>
              <span className="font-hud text-sm" style={{ color: '#ffcc00' }}>{limitedTickets}</span>
            </div>
          </div>
          <button className="font-hud text-sm px-4 py-2"
            style={{ border: '1px solid rgba(0,212,255,0.3)', color: 'rgba(0,212,255,0.6)', cursor: 'pointer' }}
            onClick={goBack}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sf-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(0,212,255,0.6)' }}>
            ← 뒤로
          </button>
        </div>
      </div>

      {/* 배너 모드 선택 */}
      <div className="relative z-10 px-8 mb-4 flex gap-2">
        {MODES.map(({ key, label, color }) => (
          <button key={key} onClick={() => setMode(key)} className="font-hud text-base px-7 py-3"
            style={{
              border: `1px solid ${mode === key ? color : 'rgba(0,212,255,0.18)'}`,
              background: mode === key ? `${color}14` : 'transparent',
              color: mode === key ? color : 'rgba(0,212,255,0.4)',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              boxShadow: mode === key ? `0 0 14px ${color}18` : 'none',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* 구분선 */}
      <div className="relative z-10 mx-8 mb-4" style={{ height: 1, background: mode === 'limited' ? 'rgba(255,204,0,0.15)' : 'rgba(0,212,255,0.1)' }} />

      {/* 컨텐츠 */}
      <div className="relative z-10 flex-1 px-8 pb-8 overflow-hidden flex flex-col">
        {mode === 'exchange' ? (
          <div className="overflow-y-auto max-w-lg"><ExchangeTab /></div>
        ) : (
          <SummonTab banner={mode} />
        )}
      </div>
    </div>
  )
}
