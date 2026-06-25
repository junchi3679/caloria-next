export type Gender = 'male' | 'female'

export type Attribute = 'arc' | 'plasma' | 'bio' | 'cryo' | 'cyber'

export type CharacterId =
  | 'ian_m' | 'ian_f'
  | 'kaira' | 'sera' | 'zei' | 'aina'
  | 'dex' | 'luka' | 'orion'

export interface Character {
  id: CharacterId
  name: string
  gender: Gender
  attribute: Attribute
  exercise: string
  description: string
  color: string
}

export type Screen = 'title' | 'character_select' | 'game'

export interface ExpItem {
  type: 'booster' | 'instant'
  name: string
  value: number
  duration?: number
}
