export type Gender = 'male' | 'female'
export type Attribute = 'arc' | 'plasma' | 'bio' | 'cryo' | 'cyber'
export type CharacterId = 'ian_m' | 'ian_f' | 'kaira' | 'sera' | 'zei' | 'aina' | 'dex' | 'luka' | 'orion' | 'nyx' | 'sol'

export interface Character {
  id: CharacterId
  name: string
  gender: Gender
  attribute: Attribute
  exercise: string
  description: string
  color: string
  unlockType: 'default' | 'story' | 'gacha' | 'limited'
  unlockHint?: string
}

export type Screen = 'title' | 'character_select' | 'game' | 'gacha' | 'shop'

export interface ExpItem { id: string; type: 'instant'; name: string; value: number }

export type WeaponRarity = 3 | 4
export type WeaponType = 'blade' | 'gun' | 'staff' | 'bow' | 'gauntlet'
export interface Weapon {
  id: string; name: string; type: WeaponType; rarity: WeaponRarity; atk: number; description: string
}

export type AccessoryRarity = 4 | 5
export type AccessoryStat = 'critRate' | 'critDmg' | 'atk' | 'def' | 'hp' | 'skillSpeed' | 'moveSpeed'
export interface AccessoryStatEntry { stat: AccessoryStat; value: number }
export interface Accessory {
  id: string
  name: string
  rarity: AccessoryRarity
  stats: AccessoryStatEntry[]
  description: string
}

export interface Skin {
  id: string
  charId: CharacterId
  name: string
  description: string
  headColor: number
  bodyColor: number
  priceCrystals: number | null
  priceGold: number | null
}

export interface GachaResult {
  type: 'weapon' | 'char' | 'accessory'
  item: Weapon | Character | Accessory
  isNew: boolean
  crystalComp: number
  shardComp: number
}

export interface MapSnapshot {
  px: number; pz: number; pa: number
  enemies: Array<{ x: number; z: number; type: 'mob' | 'boss'; alive: boolean }>
}

export type MailRewardType = 'crystals' | 'limitedCrystals' | 'gold' | 'shards' | 'standardTicket' | 'limitedTicket' | 'expItem' | 'weapon' | 'accessory'

export interface MailReward {
  type: MailRewardType
  amount?: number
  item?: ExpItem | Weapon | Accessory
}

export interface MailItem {
  id: string
  title: string
  from: string
  body: string
  rewards: MailReward[]
  claimed: boolean
  createdAt: number
  expiresAt?: number
}

export type NoticeType = 'system' | 'event' | 'update'

export interface NoticeItem {
  id: string
  type: NoticeType
  title: string
  body: string
  createdAt: number
  read: boolean
}
