import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { Weapon, Accessory, AccessoryStat } from '../../types'

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

function WeaponCard({ w }: { w: Weapon }) {
  const rarityColor = w.rarity === 4 ? '#ffd700' : '#aaaaaa'
  return (
    <div className="p-3 flex items-start gap-3" style={{ background: `${rarityColor}08`, border: `1px solid ${rarityColor}30` }}>
      <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 40 }}>
        <span style={{ color: rarityColor, fontSize: '0.7rem', letterSpacing: 1 }}>{'★'.repeat(w.rarity)}</span>
        <span className="font-hud text-xs mt-0.5" style={{ color: 'rgba(224,240,255,0.4)' }}>{TYPE_LABEL[w.type]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-hud text-sm mb-0.5" style={{ color: rarityColor }}>{w.name}</div>
        <div className="text-xs" style={{ color: 'rgba(224,240,255,0.5)' }}>ATK {w.atk}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(224,240,255,0.35)', fontSize: '0.65rem' }}>{w.description}</div>
      </div>
    </div>
  )
}

function AccessoryCard({ acc, equipped, onEquip, onUnequip, canEquip }: {
  acc: Accessory
  equipped: boolean
  onEquip: () => void
  onUnequip: () => void
  canEquip: boolean
}) {
  const rarityColor = acc.rarity === 5 ? '#ffe066' : '#ffd700'
  const rarityGlow = acc.rarity === 5 ? '#ffe06640' : '#ffd70030'
  return (
    <div
      className="p-3"
      style={{
        background: equipped ? `${rarityGlow}` : `${rarityColor}06`,
        border: `1px solid ${equipped ? rarityColor : `${rarityColor}30`}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-hud text-sm" style={{ color: rarityColor }}>{acc.name}</span>
            {acc.rarity === 5 && (
              <span className="font-hud px-1 py-0.5" style={{ fontSize: '0.55rem', background: 'rgba(255,224,102,0.15)', border: '1px solid rgba(255,224,102,0.4)', color: '#ffe066' }}>
                5★
              </span>
            )}
            {acc.rarity === 4 && (
              <span className="font-hud px-1 py-0.5" style={{ fontSize: '0.55rem', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700' }}>
                4★
              </span>
            )}
          </div>
          <div style={{ color: 'rgba(224,240,255,0.35)', fontSize: '0.62rem' }}>{acc.description}</div>
        </div>
        <button
          onClick={equipped ? onUnequip : onEquip}
          disabled={!equipped && !canEquip}
          className="font-hud text-xs px-2 py-1 flex-shrink-0"
          style={{
            border: `1px solid ${equipped ? '#00ff88' : canEquip ? rarityColor : 'rgba(255,255,255,0.1)'}`,
            color: equipped ? '#00ff88' : canEquip ? rarityColor : 'rgba(255,255,255,0.2)',
            background: equipped ? 'rgba(0,255,136,0.08)' : 'transparent',
            cursor: (equipped || canEquip) ? 'pointer' : 'not-allowed',
            fontSize: '0.6rem',
          }}
        >
          {equipped ? '장착 중' : '장착'}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {acc.stats.map((s, i) => (
          <span
            key={i}
            className="font-hud"
            style={{
              fontSize: '0.62rem',
              padding: '2px 6px',
              background: `${rarityColor}10`,
              border: `1px solid ${rarityColor}40`,
              color: rarityColor,
            }}
          >
            {STAT_LABEL[s.stat]} +{s.value}{STAT_UNIT[s.stat]}
          </span>
        ))}
      </div>
    </div>
  )
}

interface Props { onClose: () => void }

export default function Bag({ onClose }: Props) {
  const { inventory, accessories, equippedAccessories, expItems, crystals, useExpItem, equipAccessory, unequipAccessory } =
    useGameStore()
  const [tab, setTab] = useState<'weapons' | 'accessories' | 'items'>('weapons')

  const canEquipMore = equippedAccessories.length < 2

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ background: 'rgba(0,0,0,0.5)', pointerEvents: 'auto' }}
      onClick={onClose}
    >
      <div
        className="h-full flex flex-col"
        style={{ width: 360, background: 'rgba(2,6,18,0.97)', borderLeft: '1px solid rgba(0,212,255,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
          <div>
            <div className="font-hud text-xs mb-0.5" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em' }}>INVENTORY</div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: '#aa44ff' }}>◈</span>
              <span className="font-hud text-base" style={{ color: '#cc88ff' }}>{crystals.toLocaleString()}</span>
              <span className="font-hud text-xs" style={{ color: 'rgba(204,136,255,0.5)' }}>CRYSTALS</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-hud text-sm px-3 py-1"
            style={{ border: '1px solid rgba(0,212,255,0.2)', color: 'rgba(0,212,255,0.5)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* 탭 */}
        <div className="flex" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          {(['weapons', 'accessories', 'items'] as const).map((t) => {
            const label = t === 'weapons' ? `무기 (${inventory.length})` : t === 'accessories' ? `악세서리 (${accessories.length})` : `EXP (${expItems.length})`
            return (
              <button key={t} onClick={() => setTab(t)} className="flex-1 font-hud py-2.5"
                style={{
                  fontSize: '0.65rem',
                  background: tab === t ? 'rgba(0,212,255,0.07)' : 'transparent',
                  borderBottom: `2px solid ${tab === t ? 'rgba(0,212,255,0.5)' : 'transparent'}`,
                  color: tab === t ? 'rgba(0,212,255,0.9)' : 'rgba(0,212,255,0.3)',
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* 악세서리 장착 슬롯 표시 */}
        {tab === 'accessories' && (
          <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
            <span className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.5)' }}>장착 슬롯</span>
            {[0, 1].map((i) => (
              <div key={i} className="font-hud text-xs px-2 py-0.5"
                style={{
                  border: `1px solid ${i < equippedAccessories.length ? '#ffd700' : 'rgba(0,212,255,0.15)'}`,
                  color: i < equippedAccessories.length ? '#ffd700' : 'rgba(0,212,255,0.2)',
                  background: i < equippedAccessories.length ? 'rgba(255,215,0,0.08)' : 'transparent',
                  minWidth: 28, textAlign: 'center', fontSize: '0.6rem',
                }}>
                {i < equippedAccessories.length ? '●' : '○'}
              </div>
            ))}
            <span className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.35)' }}>
              {equippedAccessories.length} / 2
            </span>
          </div>
        )}

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {tab === 'weapons' && (
            inventory.length === 0
              ? <Empty icon="⚔" text="무기 없음" />
              : inventory.map((w) => <WeaponCard key={w.id} w={w} />)
          )}

          {tab === 'accessories' && (
            accessories.length === 0
              ? <Empty icon="◎" text="악세서리 없음" />
              : accessories.map((acc) => {
                  const isEquipped = equippedAccessories.includes(acc.id)
                  return (
                    <AccessoryCard
                      key={acc.id}
                      acc={acc}
                      equipped={isEquipped}
                      canEquip={canEquipMore}
                      onEquip={() => equipAccessory(acc.id)}
                      onUnequip={() => unequipAccessory(acc.id)}
                    />
                  )
                })
          )}

          {tab === 'items' && (
            expItems.length === 0
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
                ))
          )}
        </div>
      </div>
    </div>
  )
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
