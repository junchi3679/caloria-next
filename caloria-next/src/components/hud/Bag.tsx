import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { Weapon, Accessory, AccessoryStat, CharacterId, Character } from '../../types'

const TYPE_LABEL: Record<string, string> = {
  blade: '검', gun: '총', staff: '지팡이', bow: '활', gauntlet: '건틀릿',
}
const STAT_LABEL: Record<AccessoryStat, string> = {
  critRate: '치명타 확률', critDmg: '치명타 피해', atk: '공격력',
  def: '방어력', hp: 'HP', skillSpeed: '스킬 속도', moveSpeed: '이동 속도',
}
const STAT_UNIT: Record<AccessoryStat, string> = {
  critRate: '%', critDmg: '%', atk: '', def: '', hp: '',
  skillSpeed: '%', moveSpeed: '%',
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="text-center">
        <div className="font-hud text-3xl mb-3" style={{ color: 'rgba(0,212,255,0.1)' }}>{icon}</div>
        <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.25)' }}>{text}</div>
      </div>
    </div>
  )
}

// ── 무기 장착 탭 ─────────────────────────────────────────
function WeaponsTab() {
  const {
    inventory, selectedCharacters, characters,
    equippedWeapons, equipWeapon, unequipWeapon,
  } = useGameStore()

  const partyChars = selectedCharacters
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean) as import('../../types').Character[]

  const [targetCharId, setTargetCharId] = useState<CharacterId | null>(
    partyChars[0]?.id ?? null
  )

  const targetChar = partyChars.find((c) => c.id === targetCharId) ?? null
  const equippedWeaponId = targetCharId ? equippedWeapons[targetCharId] : undefined
  const equippedWeapon = inventory.find((w) => w.id === equippedWeaponId)

  function handleEquip(weaponId: string) {
    if (!targetCharId) return
    if (equippedWeaponId === weaponId) {
      unequipWeapon(targetCharId)
    } else {
      equipWeapon(targetCharId, weaponId)
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* 캐릭터 선택 바 */}
      <div className="px-4 pt-3 flex-shrink-0">
        <div className="font-hud text-xs mb-2" style={{ color: 'rgba(0,212,255,0.4)', letterSpacing: '0.15em' }}>장착 대상 캐릭터</div>
        {partyChars.length === 0 ? (
          <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.2)' }}>파티 캐릭터 없음</div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {partyChars.map((c) => {
              const isTarget = c.id === targetCharId
              const hasWeapon = equippedWeapons[c.id] != null
              return (
                <button
                  key={c.id}
                  onClick={() => setTargetCharId(c.id)}
                  className="font-hud text-xs px-3 py-2 flex flex-col items-center gap-0.5"
                  style={{
                    border: `1px solid ${isTarget ? c.color : c.color + '40'}`,
                    background: isTarget ? `${c.color}14` : 'transparent',
                    color: isTarget ? c.color : `${c.color}88`,
                    cursor: 'pointer',
                    minWidth: 64,
                    position: 'relative',
                  }}
                >
                  {c.name}
                  <span style={{ fontSize: '0.55rem', color: hasWeapon ? '#00ff88' : 'rgba(255,255,255,0.2)' }}>
                    {hasWeapon ? '⚔ 장착' : '미장착'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 선택된 캐릭터의 현재 장착 무기 */}
      {targetChar && (
        <div className="px-4 flex-shrink-0">
          <div className="font-hud text-xs mb-1.5" style={{ color: 'rgba(0,212,255,0.4)', letterSpacing: '0.12em' }}>
            {targetChar.name} · 현재 장착
          </div>
          {equippedWeapon ? (
            <div className="flex items-center gap-3 p-3"
              style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.25)' }}>
              <div className="flex flex-col">
                <span style={{ color: equippedWeapon.rarity === 4 ? '#ffd700' : '#aaaaaa', fontSize: '0.7rem' }}>
                  {'★'.repeat(equippedWeapon.rarity)}
                </span>
                <span className="font-hud text-xs" style={{ color: 'rgba(224,240,255,0.4)' }}>
                  {TYPE_LABEL[equippedWeapon.type]}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-hud text-sm" style={{ color: equippedWeapon.rarity === 4 ? '#ffd700' : '#aaaaaa' }}>
                  {equippedWeapon.name}
                </div>
                <div className="text-xs" style={{ color: 'rgba(224,240,255,0.45)' }}>ATK {equippedWeapon.atk}</div>
              </div>
              <button onClick={() => unequipWeapon(targetChar.id)} className="font-hud text-xs px-2 py-1"
                style={{ border: '1px solid rgba(255,100,100,0.3)', color: 'rgba(255,100,100,0.6)', cursor: 'pointer' }}>
                해제
              </button>
            </div>
          ) : (
            <div className="p-3 font-hud text-xs text-center"
              style={{ border: '1px solid rgba(0,212,255,0.1)', color: 'rgba(0,212,255,0.2)' }}>
              장착된 무기 없음 — 아래에서 선택하세요
            </div>
          )}
        </div>
      )}

      <div className="px-4 flex-shrink-0" style={{ height: 1, background: 'rgba(0,212,255,0.08)' }} />

      {/* 무기 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-3 flex flex-col gap-2">
        <div className="font-hud text-xs mb-1" style={{ color: 'rgba(0,212,255,0.4)', letterSpacing: '0.12em' }}>
          보유 무기 ({inventory.length})
        </div>
        {inventory.length === 0 ? (
          <Empty icon="⚔" text="무기 없음" />
        ) : (
          inventory.map((w) => {
            const rarityColor = w.rarity === 4 ? '#ffd700' : '#aaaaaa'
            const isEquippedByTarget = equippedWeaponId === w.id
            const equippedBy = partyChars.find((c) => equippedWeapons[c.id] === w.id)
            const canEquip = targetCharId != null
            return (
              <div key={w.id} className="p-3 flex items-start gap-3"
                style={{
                  background: isEquippedByTarget ? 'rgba(0,255,136,0.06)' : `${rarityColor}08`,
                  border: `1px solid ${isEquippedByTarget ? 'rgba(0,255,136,0.3)' : rarityColor + '30'}`,
                }}>
                <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 36 }}>
                  <span style={{ color: rarityColor, fontSize: '0.7rem' }}>{'★'.repeat(w.rarity)}</span>
                  <span className="font-hud text-xs mt-0.5" style={{ color: 'rgba(224,240,255,0.35)' }}>{TYPE_LABEL[w.type]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-hud text-sm mb-0.5" style={{ color: rarityColor }}>{w.name}</div>
                  <div className="text-xs" style={{ color: 'rgba(224,240,255,0.45)' }}>ATK {w.atk}</div>
                  {equippedBy && !isEquippedByTarget && (
                    <div className="font-hud mt-0.5" style={{ fontSize: '0.58rem', color: equippedBy.color + 'aa' }}>
                      {equippedBy.name} 장착 중
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleEquip(w.id)}
                  disabled={!canEquip}
                  className="font-hud text-xs px-2 py-1.5 flex-shrink-0"
                  style={{
                    border: `1px solid ${isEquippedByTarget ? '#00ff88' : canEquip ? rarityColor : 'rgba(255,255,255,0.1)'}`,
                    color: isEquippedByTarget ? '#00ff88' : canEquip ? rarityColor : 'rgba(255,255,255,0.2)',
                    background: isEquippedByTarget ? 'rgba(0,255,136,0.08)' : 'transparent',
                    cursor: canEquip ? 'pointer' : 'not-allowed',
                    fontSize: '0.62rem',
                    minWidth: 44,
                  }}
                >
                  {isEquippedByTarget ? '장착 중' : '장착'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── 악세서리 탭 (캐릭터별) ────────────────────────────────
function AccessoriesTab() {
  const {
    accessories, equippedAccessories, equipAccessory, unequipAccessory,
    selectedCharacters, characters,
  } = useGameStore()

  const partyChars = selectedCharacters
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean) as Character[]

  const [targetCharId, setTargetCharId] = useState<CharacterId | null>(
    partyChars[0]?.id ?? null
  )

  const slots = targetCharId ? (equippedAccessories[targetCharId] ?? []) : []
  const canEquipMore = slots.length < 2

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* 캐릭터 선택 */}
      <div className="px-4 pt-3 flex-shrink-0">
        <div className="font-hud text-xs mb-2" style={{ color: 'rgba(0,212,255,0.4)', letterSpacing: '0.15em' }}>장착 대상 캐릭터</div>
        {partyChars.length === 0 ? (
          <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.2)' }}>파티 캐릭터 없음</div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {partyChars.map((c) => {
              const isTarget = c.id === targetCharId
              const charSlots = equippedAccessories[c.id] ?? []
              return (
                <button key={c.id} onClick={() => setTargetCharId(c.id)}
                  className="font-hud text-xs px-3 py-2 flex flex-col items-center gap-0.5"
                  style={{
                    border: `1px solid ${isTarget ? c.color : c.color + '40'}`,
                    background: isTarget ? `${c.color}14` : 'transparent',
                    color: isTarget ? c.color : `${c.color}88`,
                    cursor: 'pointer', minWidth: 64,
                  }}>
                  {c.name}
                  <span style={{ fontSize: '0.55rem', color: charSlots.length > 0 ? '#ffd700' : 'rgba(255,255,255,0.2)' }}>
                    {charSlots.length > 0 ? `◎×${charSlots.length}` : '미장착'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 선택 캐릭터의 장착 슬롯 */}
      {targetCharId && (
        <div className="px-4 flex-shrink-0">
          <div className="font-hud text-xs mb-1.5" style={{ color: 'rgba(0,212,255,0.4)', letterSpacing: '0.12em' }}>
            {characters.find((c) => c.id === targetCharId)?.name} · 장착 슬롯 {slots.length} / 2
          </div>
          <div className="flex gap-2">
            {[0, 1].map((i) => {
              const accId = slots[i]
              const acc = accessories.find((a) => a.id === accId)
              return (
                <div key={i} className="flex-1 p-2 flex items-center gap-2"
                  style={{ border: `1px solid ${acc ? '#ffd70040' : 'rgba(0,212,255,0.1)'}`, background: acc ? 'rgba(255,215,0,0.05)' : 'transparent', minHeight: 44 }}>
                  {acc ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="font-hud truncate" style={{ fontSize: '0.65rem', color: '#ffd700' }}>{acc.name}</div>
                        <div className="font-hud" style={{ fontSize: '0.52rem', color: 'rgba(255,215,0,0.5)' }}>{acc.rarity}★</div>
                      </div>
                      <button onClick={() => unequipAccessory(targetCharId, acc.id)}
                        className="font-hud flex-shrink-0"
                        style={{ fontSize: '0.55rem', padding: '2px 6px', border: '1px solid rgba(255,100,100,0.3)', color: 'rgba(255,100,100,0.6)', cursor: 'pointer' }}>
                        해제
                      </button>
                    </>
                  ) : (
                    <div className="font-hud w-full text-center" style={{ fontSize: '0.6rem', color: 'rgba(0,212,255,0.2)' }}>빈 슬롯</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="px-4 flex-shrink-0" style={{ height: 1, background: 'rgba(0,212,255,0.08)' }} />

      {/* 악세서리 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-3 flex flex-col gap-2">
        <div className="font-hud text-xs mb-1" style={{ color: 'rgba(0,212,255,0.4)', letterSpacing: '0.12em' }}>
          보유 악세서리 ({accessories.length})
        </div>
        {accessories.length === 0 ? (
          <Empty icon="◎" text="악세서리 없음" />
        ) : (
          accessories.map((acc) => {
            const rarityColor = acc.rarity === 5 ? '#ffe066' : '#ffd700'
            const isEquippedByTarget = targetCharId ? slots.includes(acc.id) : false
            const equippedByChar = Object.entries(equippedAccessories).find(
              ([cid, ids]) => cid !== targetCharId && (ids ?? []).includes(acc.id)
            )
            const ownerChar = equippedByChar ? characters.find((c) => c.id === equippedByChar[0]) : null
            const canEquip = !!targetCharId && canEquipMore && !isEquippedByTarget

            return (
              <div key={acc.id} className="p-3"
                style={{ background: isEquippedByTarget ? `${rarityColor}10` : `${rarityColor}05`, border: `1px solid ${isEquippedByTarget ? rarityColor : rarityColor + '25'}` }}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-hud text-sm truncate" style={{ color: rarityColor }}>{acc.name}</span>
                      <span className="font-hud px-1 py-0.5 flex-shrink-0"
                        style={{ fontSize: '0.52rem', background: `${rarityColor}18`, border: `1px solid ${rarityColor}40`, color: rarityColor }}>
                        {acc.rarity}★
                      </span>
                    </div>
                    {ownerChar && (
                      <div className="font-hud" style={{ fontSize: '0.55rem', color: ownerChar.color + 'aa' }}>
                        {ownerChar.name} 장착 중
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => targetCharId && (isEquippedByTarget ? unequipAccessory(targetCharId, acc.id) : equipAccessory(targetCharId, acc.id))}
                    disabled={!isEquippedByTarget && !canEquip}
                    className="font-hud text-xs px-2 py-1 flex-shrink-0"
                    style={{
                      border: `1px solid ${isEquippedByTarget ? '#00ff88' : canEquip ? rarityColor : 'rgba(255,255,255,0.1)'}`,
                      color: isEquippedByTarget ? '#00ff88' : canEquip ? rarityColor : 'rgba(255,255,255,0.2)',
                      background: isEquippedByTarget ? 'rgba(0,255,136,0.08)' : 'transparent',
                      cursor: (isEquippedByTarget || canEquip) ? 'pointer' : 'not-allowed',
                      fontSize: '0.6rem', minWidth: 44,
                    }}>
                    {isEquippedByTarget ? '장착 중' : '장착'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {acc.stats.map((s, i) => (
                    <span key={i} className="font-hud"
                      style={{ fontSize: '0.58rem', padding: '2px 5px', background: `${rarityColor}10`, border: `1px solid ${rarityColor}35`, color: rarityColor }}>
                      {STAT_LABEL[s.stat]} +{s.value}{STAT_UNIT[s.stat]}
                    </span>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── 메인 가방 ─────────────────────────────────────────────
interface Props { onClose: () => void }

export default function Bag({ onClose }: Props) {
  const { accessories, expItems, crystals, useExpItem, inventory } = useGameStore()
  const [tab, setTab] = useState<'weapons' | 'accessories' | 'items'>('weapons')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ background: 'rgba(0,0,0,0.5)', pointerEvents: 'auto' }}
      onClick={onClose}>
      <div className="h-full flex flex-col"
        style={{ width: 380, background: 'rgba(2,6,18,0.97)', borderLeft: '1px solid rgba(0,212,255,0.2)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
          <div>
            <div className="font-hud text-xs mb-0.5" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>INVENTORY</div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: '#aa44ff' }}>◈</span>
              <span className="font-hud text-base" style={{ color: '#cc88ff' }}>{crystals.toLocaleString()}</span>
              <span className="font-hud text-xs" style={{ color: 'rgba(204,136,255,0.5)' }}>CRYSTALS</span>
            </div>
          </div>
          <button onClick={onClose} className="font-hud text-sm px-3 py-1"
            style={{ border: '1px solid rgba(0,212,255,0.2)', color: 'rgba(0,212,255,0.5)', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* 탭 */}
        <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          {(['weapons', 'accessories', 'items'] as const).map((t) => {
            const label = t === 'weapons' ? `무기 (${inventory.length})` : t === 'accessories' ? `악세서리 (${accessories.length})` : `EXP (${expItems.length})`
            return (
              <button key={t} onClick={() => setTab(t)} className="flex-1 font-hud py-2.5"
                style={{
                  fontSize: '0.65rem',
                  background: tab === t ? 'rgba(0,212,255,0.07)' : 'transparent',
                  borderBottom: `2px solid ${tab === t ? 'rgba(0,212,255,0.5)' : 'transparent'}`,
                  color: tab === t ? 'rgba(0,212,255,0.9)' : 'rgba(0,212,255,0.3)',
                  cursor: 'pointer', letterSpacing: '0.06em',
                }}>
                {label}
              </button>
            )
          })}
        </div>


        {/* 컨텐츠 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === 'weapons' && <WeaponsTab />}

          {tab === 'accessories' && <AccessoriesTab />}

          {tab === 'items' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {expItems.length === 0
                ? <Empty icon="◎" text="EXP 아이템 없음" />
                : expItems.map((item) => (
                    <div key={item.id} className="p-3 flex items-center gap-3"
                      style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
                      <div className="flex-1">
                        <div className="font-hud text-sm mb-0.5" style={{ color: '#00d4ff' }}>{item.name}</div>
                        <div className="text-xs" style={{ color: 'rgba(0,212,255,0.5)' }}>EXP +{item.value}</div>
                      </div>
                      <button onClick={() => useExpItem(item.id)} className="font-hud text-xs px-3 py-1.5"
                        style={{ border: '1px solid rgba(0,255,136,0.4)', color: 'rgba(0,255,136,0.7)', cursor: 'pointer', background: 'rgba(0,255,136,0.06)' }}>
                        사용
                      </button>
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
