export type Gender = 'male' | 'female'
export type Attribute = 'arc' | 'plasma' | 'bio' | 'cryo' | 'cyber'
export type CharacterId = 'ian_m' | 'ian_f' | 'kaira' | 'sera' | 'zei' | 'aina' | 'dex' | 'luka' | 'orion'

export interface Character {
  id: CharacterId
  name: string
  gender: Gender
  attribute: Attribute
  exercise: string
  description: string
  color: string
  unlockType: 'default' | 'story' | 'gacha'
  unlockHint?: string
}

export type Screen = 'title' | 'character_select' | 'game' | 'gacha'

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

export interface GachaResult {
  type: 'weapon' | 'char' | 'accessory'
  item: Weapon | Character | Accessory
  isNew: boolean
  crystalComp: number
}

export interface MapSnapshot {
  px: number; pz: number; pa: number
  enemies: Array<{ x: number; z: number; type: 'mob' | 'boss'; alive: boolean }>
}
