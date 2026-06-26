import { useState } from 'react'
import { useGameStore, SKINS, CHARACTERS } from '../../store/gameStore'
import type { CharacterId } from '../../types'

const ATTR_COLOR: Record<string, string> = {
  arc: '#00d4ff', plasma: '#ff4466', bio: '#44ff88', cryo: '#44aaff', cyber: '#aa44ff',
}

export default function SkinShop() {
  const { setScreen, crystals, gold, ownedSkins, equippedSkins, buySkin, equipSkin } = useGameStore()
  const [selectedChar, setSelectedChar] = useState<CharacterId>('ian_m')
  const [msg, setMsg] = useState('')

  const charData = CHARACTERS.find((c) => c.id === selectedChar)
  const charColor = charData ? (ATTR_COLOR[charData.attribute] ?? '#00d4ff') : '#00d4ff'
  const skins = SKINS.filter((s) => s.charId === selectedChar)
  const equipped = equippedSkins[selectedChar]

  const uniqueChars = Array.from(new Set(SKINS.map((s) => s.charId)))

  function handleBuy(skinId: string, currency: 'crystals' | 'gold') {
    const ok = buySkin(skinId, currency)
    setMsg(ok ? '구매 완료!' : (currency === 'crystals' ? '크리스탈이 부족합니다.' : '골드가 부족합니다.'))
    setTimeout(() => setMsg(''), 2000)
  }

  function handleEquip(skinId: string) {
    equipSkin(selectedChar, equipped === skinId ? null : skinId)
  }

  return (
    <div className="fixed inset-0 scanline flex flex-col" style={{ background: 'var(--sf-bg)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />

      {/* 헤더 */}
      <div className="relative z-10 px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <div className="font-hud text-xs mb-1" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.2em' }}>CALORIA · SHOP</div>
          <h1 className="font-hud text-3xl text-glow" style={{ letterSpacing: '0.05em' }}>SKIN SHOP</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="sf-panel px-3 py-1.5 flex items-center gap-2">
            <span style={{ color: '#aa44ff', fontSize: '0.9rem' }}>◈</span>
            <span className="font-hud text-base" style={{ color: '#cc88ff' }}>{crystals.toLocaleString()}</span>
          </div>
          <div className="sf-panel px-3 py-1.5 flex items-center gap-2">
            <span style={{ fontSize: '0.9rem' }}>🪙</span>
            <span className="font-hud text-base" style={{ color: '#ffd700' }}>{gold.toLocaleString()}</span>
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

      {msg && (
        <div className="relative z-10 mx-8 mb-2 font-hud text-xs text-center py-2"
          style={{ color: msg.includes('완료') ? '#00ff88' : '#ff4466', border: `1px solid ${msg.includes('완료') ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,102,0.3)'}`, background: msg.includes('완료') ? 'rgba(0,255,136,0.06)' : 'rgba(255,68,102,0.06)' }}>
          {msg}
        </div>
      )}

      <div className="relative z-10 flex flex-1 gap-6 px-8 pb-8 overflow-hidden">

        {/* 왼쪽: 캐릭터 선택 */}
        <div className="w-48 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          <div className="font-hud text-xs mb-1" style={{ color: 'rgba(0,212,255,0.4)', letterSpacing: '0.15em' }}>캐릭터</div>
          {uniqueChars.map((id) => {
            const c = CHARACTERS.find((ch) => ch.id === id)
            if (!c) return null
            const cc = ATTR_COLOR[c.attribute] ?? '#00d4ff'
            const isSelected = id === selectedChar
            return (
              <button
                key={id}
                onClick={() => setSelectedChar(id)}
                className="text-left p-3"
                style={{
                  border: `1px solid ${isSelected ? cc : 'rgba(0,212,255,0.12)'}`,
                  background: isSelected ? `${cc}12` : 'rgba(0,5,20,0.6)',
                  cursor: 'pointer',
                  boxShadow: isSelected ? `0 0 10px ${cc}25` : 'none',
                }}
              >
                <div className="font-hud text-xs" style={{ color: isSelected ? cc : 'rgba(224,240,255,0.5)' }}>{c.name}</div>
                <div className="font-hud mt-0.5" style={{ fontSize: '0.55rem', color: 'rgba(224,240,255,0.3)' }}>
                  {SKINS.filter((s) => s.charId === id).length}종 스킨
                </div>
              </button>
            )
          })}
        </div>

        {/* 오른쪽: 스킨 목록 */}
        <div className="flex-1 overflow-y-auto">
          <div className="font-hud text-xs mb-3" style={{ color: charColor, letterSpacing: '0.1em' }}>
            {charData?.name} 스킨 ({skins.length}종)
          </div>

          {skins.length === 0 && (
            <div className="font-hud text-sm" style={{ color: 'rgba(224,240,255,0.2)' }}>등록된 스킨이 없습니다.</div>
          )}

          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {skins.map((skin) => {
              const owned = ownedSkins.includes(skin.id)
              const isEquipped = equipped === skin.id
              const canAffordCrystals = skin.priceCrystals !== null && crystals >= skin.priceCrystals
              const canAffordGold = skin.priceGold !== null && gold >= skin.priceGold

              return (
                <div
                  key={skin.id}
                  className="p-4 flex flex-col gap-3"
                  style={{
                    border: `1px solid ${isEquipped ? charColor : owned ? 'rgba(0,255,136,0.3)' : 'rgba(0,212,255,0.12)'}`,
                    background: isEquipped ? `${charColor}10` : owned ? 'rgba(0,255,136,0.04)' : 'rgba(0,5,20,0.6)',
                    boxShadow: isEquipped ? `0 0 14px ${charColor}20` : 'none',
                  }}
                >
                  {/* 색상 미리보기 */}
                  <div className="flex gap-3 items-center">
                    <div className="flex gap-1.5">
                      <div style={{ width: 28, height: 28, background: `#${skin.headColor.toString(16).padStart(6, '0')}`, border: '1px solid rgba(255,255,255,0.15)' }} />
                      <div style={{ width: 28, height: 28, background: `#${skin.bodyColor.toString(16).padStart(6, '0')}`, border: '1px solid rgba(255,255,255,0.15)' }} />
                    </div>
                    <div>
                      <div className="font-hud text-sm" style={{ color: owned ? (isEquipped ? charColor : '#00ff88') : 'rgba(224,240,255,0.7)' }}>
                        {skin.name}
                      </div>
                      {isEquipped && <div className="font-hud" style={{ fontSize: '0.55rem', color: charColor, letterSpacing: '0.1em' }}>장착 중</div>}
                      {owned && !isEquipped && <div className="font-hud" style={{ fontSize: '0.55rem', color: '#00ff88' }}>보유 중</div>}
                    </div>
                  </div>

                  <div className="text-xs" style={{ color: 'rgba(224,240,255,0.4)' }}>{skin.description}</div>

                  {owned ? (
                    <button
                      onClick={() => handleEquip(skin.id)}
                      className="font-hud text-xs py-2 w-full"
                      style={{
                        border: `1px solid ${isEquipped ? charColor : 'rgba(0,255,136,0.4)'}`,
                        color: isEquipped ? charColor : '#00ff88',
                        cursor: 'pointer',
                        background: isEquipped ? `${charColor}18` : 'rgba(0,255,136,0.06)',
                      }}
                    >
                      {isEquipped ? '장착 해제' : '장착하기'}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {skin.priceCrystals !== null && (
                        <button
                          onClick={() => handleBuy(skin.id, 'crystals')}
                          disabled={!canAffordCrystals}
                          className="font-hud text-xs py-2 w-full"
                          style={{
                            border: `1px solid ${canAffordCrystals ? '#aa44ff' : 'rgba(170,68,255,0.2)'}`,
                            color: canAffordCrystals ? '#cc88ff' : 'rgba(170,68,255,0.3)',
                            cursor: canAffordCrystals ? 'pointer' : 'not-allowed',
                            background: canAffordCrystals ? 'rgba(170,68,255,0.1)' : 'transparent',
                          }}
                        >
                          ◈ {skin.priceCrystals} 크리스탈
                        </button>
                      )}
                      {skin.priceGold !== null && (
                        <button
                          onClick={() => handleBuy(skin.id, 'gold')}
                          disabled={!canAffordGold}
                          className="font-hud text-xs py-2 w-full"
                          style={{
                            border: `1px solid ${canAffordGold ? '#ffd700' : 'rgba(255,215,0,0.2)'}`,
                            color: canAffordGold ? '#ffd700' : 'rgba(255,215,0,0.3)',
                            cursor: canAffordGold ? 'pointer' : 'not-allowed',
                            background: canAffordGold ? 'rgba(255,215,0,0.06)' : 'transparent',
                          }}
                        >
                          🪙 {skin.priceGold} 골드
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
