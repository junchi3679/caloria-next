import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Screen, CharacterId, Character, Weapon, ExpItem, GachaResult, Accessory, AccessoryStat, AccessoryStatEntry } from '../types'

const PULL_COST_1 = 80
const PULL_COST_10 = 750

export const CHARACTERS: Character[] = [
  { id: 'ian_m', name: '이안 (남)', gender: 'male',   attribute: 'arc',    exercise: '달리기 / 파쿠르',     description: '기후복원 프로젝트 단독 파견 요원. 임무를 최우선으로 한다.', color: '#00d4ff', unlockType: 'default' },
  { id: 'ian_f', name: '이안 (여)', gender: 'female', attribute: 'arc',    exercise: '달리기 / 파쿠르',     description: '기후복원 프로젝트 단독 파견 요원. 임무를 최우선으로 한다.', color: '#00d4ff', unlockType: 'default' },
  { id: 'kaira', name: '카이라',    gender: 'female', attribute: 'plasma', exercise: '스쿼트 / 근력',       description: '전직 행성 방위군. 혼자 폐허를 순찰하며 속죄 중.',           color: '#ff4466', unlockType: 'story', unlockHint: 'LV.5 해금' },
  { id: 'sera',  name: '세라',      gender: 'female', attribute: 'bio',    exercise: '요가 / 스트레칭',     description: '생태 복원 연구원. 고립된 기지에서 데이터를 수집 중.',        color: '#44ff88', unlockType: 'story', unlockHint: 'LV.10 해금' },
  { id: 'zei',   name: '제이',      gender: 'female', attribute: 'cryo',   exercise: '장거리 달리기',       description: '화물선 조종사. 3개월째 행성을 홀로 횡단 중.',               color: '#44aaff', unlockType: 'story', unlockHint: 'LV.15 해금' },
  { id: 'aina',  name: '아이나',    gender: 'female', attribute: 'cyber',  exercise: '플랭크 / 코어',       description: '시스템 엔지니어. 프리즈 코드의 배후를 추적 중.',             color: '#aa44ff', unlockType: 'gacha' },
  { id: 'dex',   name: '덱스',      gender: 'male',   attribute: 'plasma', exercise: '데드리프트 / 푸시업', description: '개척 노동자. 고향 행성이 사막이 되어 원인을 찾아 떠남.',     color: '#ff8844', unlockType: 'gacha' },
  { id: 'luka',  name: '루카',      gender: 'male',   attribute: 'cryo',   exercise: '버피 / 인터벌',       description: '전 은하계 마라톤 챔피언. 레이스 도중 불시착.',               color: '#44ffdd', unlockType: 'gacha' },
  { id: 'orion', name: '오리온',    gender: 'male',   attribute: 'cyber',  exercise: '밸런스 / 코어',       description: '연방 정보 분석관. 질서 동맹을 수년간 단독 추적 중.',         color: '#cc88ff', unlockType: 'gacha' },
]

const STORY_UNLOCKS: Record<number, CharacterId> = { 5: 'kaira', 10: 'sera', 15: 'zei' }
export const GACHA_CHARS = CHARACTERS.filter((c) => c.unlockType === 'gacha')

// ── 무기 풀 ────────────────────────────────────────────────
const WEAPONS_3STAR: Weapon[] = [
  { id: 'w3_blade', name: '파멸의 단검',   type: 'blade',    rarity: 3, atk: 280, description: '잊혀진 행성에서 발굴된 고대 단검.' },
  { id: 'w3_gun',   name: '폭풍 권총',     type: 'gun',      rarity: 3, atk: 240, description: '대기 방전 에너지를 압축해 발사한다.' },
  { id: 'w3_staff', name: '우주 지팡이',   type: 'staff',    rarity: 3, atk: 260, description: '항성 코어의 잔열로 만들어진 지팡이.' },
  { id: 'w3_bow',   name: '광자 활',       type: 'bow',      rarity: 3, atk: 250, description: '빛의 속도로 화살을 쏘아낸다.' },
  { id: 'w3_gaunt', name: '강철 건틀릿',   type: 'gauntlet', rarity: 3, atk: 270, description: '정제된 행성 금속으로 주조된 건틀릿.' },
]
const WEAPONS_4STAR: Weapon[] = [
  { id: 'w4_blade', name: '진공의 검',       type: 'blade',    rarity: 4, atk: 510, description: '공간을 가르는 진공의 검날. 전설급 병기.' },
  { id: 'w4_gun',   name: '플라즈마 캐논',   type: 'gun',      rarity: 4, atk: 480, description: '행성 핵에서 추출한 플라즈마를 압축 발사.' },
  { id: 'w4_staff', name: '네뷸라 완드',     type: 'staff',    rarity: 4, atk: 500, description: '성운의 에너지를 담은 신비로운 완드.' },
  { id: 'w4_bow',   name: '반중력 활',       type: 'bow',      rarity: 4, atk: 490, description: '중력을 역이용해 탄도를 굴절시킨다.' },
  { id: 'w4_gaunt', name: '크리스탈 건틀릿', type: 'gauntlet', rarity: 4, atk: 520, description: '행성 내부 결정체를 융합시킨 최강의 건틀릿.' },
]

// ── 악세서리 풀 ────────────────────────────────────────────
const ACC_4STAR_NAMES = [
  { name: '별빛 반지',     desc: '고대 별빛을 담은 반지. 착용자의 잠재력을 끌어올린다.' },
  { name: '크리스탈 목걸이', desc: '행성 내부 결정으로 만든 목걸이. 신체 능력을 강화한다.' },
  { name: '에너지 팔찌',   desc: '압축 에너지를 순환시켜 전투력을 높인다.' },
  { name: '코어 이어링',   desc: '행성 코어 파편을 세공한 귀걸이. 집중력을 향상시킨다.' },
  { name: '플라즈마 밴드', desc: '플라즈마 에너지를 피부에 전달해 능력치를 강화한다.' },
]
const ACC_5STAR_NAMES = [
  { name: '고대 성운 반지',   desc: '수억 년 된 성운 물질로 만든 반지. 전설적인 힘을 지닌다.' },
  { name: '진공 크리스탈',   desc: '진공 공간에서 생성된 결정체. 극한의 능력치를 부여한다.' },
  { name: '항성 코어 펜던트', desc: '항성의 코어를 담은 펜던트. 착용자를 별처럼 빛나게 한다.' },
  { name: '반중력 팔찌',     desc: '중력을 조작해 신체 능력을 극대화한다.' },
  { name: '네뷸라 이어링',   desc: '성운 에너지를 결정화한 귀걸이. 두 가지 능력을 동시에 강화한다.' },
]

const ALL_STATS: AccessoryStat[] = ['critRate', 'critDmg', 'atk', 'def', 'hp', 'skillSpeed', 'moveSpeed']

const STAT_VALUES: Record<AccessoryStat, Record<4 | 5, number>> = {
  critRate:   { 4: 8,   5: 12  },
  critDmg:    { 4: 20,  5: 30  },
  atk:        { 4: 80,  5: 120 },
  def:        { 4: 60,  5: 90  },
  hp:         { 4: 300, 5: 500 },
  skillSpeed: { 4: 8,   5: 15  },
  moveSpeed:  { 4: 10,  5: 18  },
}

function rollAccessory(idx: number): Accessory {
  const is5Star = Math.random() < 0.40
  const rarity = (is5Star ? 5 : 4) as 4 | 5
  const pool = is5Star ? ACC_5STAR_NAMES : ACC_4STAR_NAMES
  const base = pool[Math.floor(Math.random() * pool.length)]
  const statCount = is5Star ? 2 : 1
  const shuffled = [...ALL_STATS].sort(() => Math.random() - 0.5)
  const stats: AccessoryStatEntry[] = shuffled.slice(0, statCount).map((stat) => ({
    stat,
    value: STAT_VALUES[stat][rarity],
  }))
  return { id: `acc_${Date.now()}_${idx}`, name: base.name, rarity, stats, description: base.desc }
}

// ── 스토어 타입 ────────────────────────────────────────────
interface GameState {
  screen: Screen
  selectedCharacters: CharacterId[]
  characters: Character[]
  unlockedCharacters: CharacterId[]

  playerLevel: number
  playerExp: number
  expToNextLevel: number

  exerciseSeconds: number
  lastWarningAt: number

  crystals: number
  activeBooster: { multiplier: number; endsAt: number } | null
  inventory: Weapon[]
  accessories: Accessory[]
  equippedAccessories: string[]
  expItems: ExpItem[]

  partyHp: Array<{ cur: number; max: number }>

  setScreen: (screen: Screen) => void
  toggleCharacter: (id: CharacterId) => void
  swapIanGender: () => void
  addExp: (amount: number) => void
  addCrystals: (amount: number) => void
  tickExercise: () => void
  activateBooster: (multiplier: number, durationMin: number) => void
  pull: (type: 'weapon' | 'char' | 'accessory', count: 1 | 10) => GachaResult[] | null
  useExpItem: (id: string) => void
  equipAccessory: (id: string) => void
  unequipAccessory: (id: string) => void
  getEquippedStats: () => Record<AccessoryStat, number>
  initPartyHp: (count: number) => void
  damagePartyMember: (idx: number, dmg: number) => void
}

function calcExpToNext(level: number) {
  return Math.floor(100 * Math.pow(1.25, level - 1))
}

const EMPTY_STATS: Record<AccessoryStat, number> = {
  critRate: 0, critDmg: 0, atk: 0, def: 0, hp: 0, skillSpeed: 0, moveSpeed: 0,
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'title',
      selectedCharacters: [],
      characters: CHARACTERS,
      unlockedCharacters: ['ian_m', 'ian_f'],

      playerLevel: 1,
      playerExp: 0,
      expToNextLevel: calcExpToNext(1),

      exerciseSeconds: 0,
      lastWarningAt: 0,

      crystals: 160,
      activeBooster: null,
      inventory: [],
      accessories: [],
      equippedAccessories: [],
      expItems: [
        { id: 'ei_start_1', type: 'instant', name: '성장의 코어',    value: 50 },
        { id: 'ei_start_2', type: 'instant', name: '성장의 코어',    value: 50 },
        { id: 'ei_start_3', type: 'instant', name: '고급 성장 코어', value: 200 },
      ],
      partyHp: [],

      setScreen: (screen) => set({ screen }),

      toggleCharacter: (id) => {
        const { selectedCharacters } = get()
        const otherIan = id === 'ian_m' ? 'ian_f' : id === 'ian_f' ? 'ian_m' : null

        if (selectedCharacters.includes(id)) {
          set({ selectedCharacters: selectedCharacters.filter((c) => c !== id) })
        } else if (otherIan && selectedCharacters.includes(otherIan)) {
          // Ian gender swap in place (keeps same slot position)
          set({ selectedCharacters: selectedCharacters.map((c) => (c === otherIan ? id : c)) })
        } else if (selectedCharacters.length < 4) {
          set({ selectedCharacters: [...selectedCharacters, id] })
        }
      },

      swapIanGender: () => {
        const { selectedCharacters } = get()
        set({
          selectedCharacters: selectedCharacters.map((id) =>
            id === 'ian_m' ? 'ian_f' : id === 'ian_f' ? 'ian_m' : id,
          ),
        })
      },

      addExp: (baseAmount) => {
        const { activeBooster, playerLevel, playerExp, expToNextLevel, unlockedCharacters } = get()
        const now = Date.now()
        const mult = activeBooster && activeBooster.endsAt > now ? activeBooster.multiplier : 1
        const amount = Math.floor(baseAmount * mult)

        let newExp = playerExp + amount
        let newLevel = playerLevel
        let newExpToNext = expToNextLevel
        const newUnlocked = [...unlockedCharacters]

        while (newExp >= newExpToNext) {
          newExp -= newExpToNext
          newLevel++
          newExpToNext = calcExpToNext(newLevel)
          const unlock = STORY_UNLOCKS[newLevel]
          if (unlock && !newUnlocked.includes(unlock)) newUnlocked.push(unlock)
        }

        set({ playerExp: newExp, playerLevel: newLevel, expToNextLevel: newExpToNext, unlockedCharacters: newUnlocked })
      },

      addCrystals: (amount) => set((s) => ({ crystals: s.crystals + amount })),

      tickExercise: () => {
        const { exerciseSeconds, lastWarningAt } = get()
        const next = exerciseSeconds + 1
        set({
          exerciseSeconds: next,
          lastWarningAt: next - lastWarningAt >= 3600 && next > 0 ? next : lastWarningAt,
        })
      },

      activateBooster: (multiplier, durationMin) =>
        set({ activeBooster: { multiplier, endsAt: Date.now() + durationMin * 60 * 1000 } }),

      pull: (type, count) => {
        const { crystals, unlockedCharacters, inventory, accessories } = get()
        const cost = count === 1 ? PULL_COST_1 : PULL_COST_10
        if (crystals < cost) return null

        const results: GachaResult[] = []
        const newWeapons: Weapon[] = []
        const newAccessories: Accessory[] = []
        const newUnlocked = [...unlockedCharacters]
        let totalCrystalComp = 0

        for (let i = 0; i < count; i++) {
          if (type === 'weapon') {
            const pool = Math.random() < 0.15 ? WEAPONS_4STAR : WEAPONS_3STAR
            const base = pool[Math.floor(Math.random() * pool.length)]
            const weapon: Weapon = { ...base, id: `${base.id}_${Date.now()}_${i}` }
            newWeapons.push(weapon)
            results.push({ type: 'weapon', item: weapon, isNew: true, crystalComp: 0 })
          } else if (type === 'accessory') {
            const acc = rollAccessory(i)
            newAccessories.push(acc)
            results.push({ type: 'accessory', item: acc, isNew: true, crystalComp: 0 })
          } else {
            const charData = GACHA_CHARS[Math.floor(Math.random() * GACHA_CHARS.length)]
            const isNew = !newUnlocked.includes(charData.id as CharacterId)
            const comp = isNew ? 0 : 40
            if (isNew) newUnlocked.push(charData.id as CharacterId)
            totalCrystalComp += comp
            results.push({ type: 'char', item: charData, isNew, crystalComp: comp })
          }
        }

        set({
          crystals: crystals - cost + totalCrystalComp,
          inventory: [...inventory, ...newWeapons],
          accessories: [...accessories, ...newAccessories],
          unlockedCharacters: newUnlocked,
        })

        return results
      },

      useExpItem: (id) => {
        const { expItems, addExp } = get()
        const item = expItems.find((e) => e.id === id)
        if (!item) return
        addExp(item.value)
        set((s) => ({ expItems: s.expItems.filter((e) => e.id !== id) }))
      },

      equipAccessory: (id) => {
        const { equippedAccessories } = get()
        if (equippedAccessories.includes(id) || equippedAccessories.length >= 2) return
        set({ equippedAccessories: [...equippedAccessories, id] })
      },

      unequipAccessory: (id) => {
        set((s) => ({ equippedAccessories: s.equippedAccessories.filter((e) => e !== id) }))
      },

      getEquippedStats: () => {
        const { equippedAccessories, accessories } = get()
        const stats = { ...EMPTY_STATS }
        equippedAccessories.forEach((id) => {
          const acc = accessories.find((a) => a.id === id)
          if (!acc) return
          acc.stats.forEach(({ stat, value }) => { stats[stat] += value })
        })
        return stats
      },

      initPartyHp: (count) => {
        set({ partyHp: Array.from({ length: count }, () => ({ cur: 300, max: 300 })) })
      },

      damagePartyMember: (idx, dmg) => {
        const { partyHp } = get()
        if (!partyHp[idx]) return
        const newHp = [...partyHp]
        newHp[idx] = { ...newHp[idx], cur: Math.max(newHp[idx].cur - dmg, 0) }
        set({ partyHp: newHp })
      },
    }),
    {
      name: 'caloria-ng-v2',
      partialize: (s) => ({
        playerLevel: s.playerLevel,
        playerExp: s.playerExp,
        expToNextLevel: s.expToNextLevel,
        unlockedCharacters: s.unlockedCharacters,
        inventory: s.inventory,
        accessories: s.accessories,
        equippedAccessories: s.equippedAccessories,
        expItems: s.expItems,
        crystals: s.crystals,
      }),
    }
  )
)

export { PULL_COST_1, PULL_COST_10 }
