import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Screen, CharacterId, Character, Weapon, ExpItem, GachaResult,
  Accessory, AccessoryStat, AccessoryStatEntry, Skin, MailItem, MailReward, NoticeItem,
} from '../types'

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
  // ── 한정 캐릭터 ──
  { id: 'nyx',   name: '닉스',      gender: 'female', attribute: 'cyber',  exercise: '격투 / 근력',         description: '어둠 속 침투 전문가. 행성 지하 네트워크를 단독 장악 중.',    color: '#ff44ff', unlockType: 'limited' },
  { id: 'sol',   name: '솔',        gender: 'male',   attribute: 'plasma', exercise: '달리기 / HIIT',       description: '태양광 에너지 연구원. 잃어버린 항성 지도를 복구 중.',        color: '#ff9900', unlockType: 'limited' },
]

const STORY_UNLOCKS: Record<number, CharacterId> = { 5: 'kaira', 10: 'sera', 15: 'zei' }
export const GACHA_CHARS = CHARACTERS.filter((c) => c.unlockType === 'gacha')
export const LIMITED_CHARS = CHARACTERS.filter((c) => c.unlockType === 'limited')
export const FEATURED_CHAR: CharacterId = 'nyx'

export const SKINS: Skin[] = [
  { id: 'ian_m_fire',   charId: 'ian_m', name: '화염 전투복',   description: '화염 속성으로 강화된 전투복.',   headColor: 0xff5522, bodyColor: 0x441100, priceCrystals: 200, priceGold: null },
  { id: 'ian_m_ice',    charId: 'ian_m', name: '빙하 전투복',   description: '극한의 냉기로 제작된 전투복.',   headColor: 0x44ddff, bodyColor: 0x002244, priceCrystals: null, priceGold: 400 },
  { id: 'ian_f_shadow', charId: 'ian_f', name: '그림자 전투복', description: '빛을 흡수하는 특수 재질 전투복.', headColor: 0xaa44ff, bodyColor: 0x220033, priceCrystals: 200, priceGold: null },
  { id: 'ian_f_gold',   charId: 'ian_f', name: '황금 전투복',   description: '희귀 광물로 제작된 황금빛 전투복.', headColor: 0xffcc00, bodyColor: 0x442200, priceCrystals: null, priceGold: 400 },
  { id: 'kaira_void',   charId: 'kaira', name: '공허 전투복',   description: '행성 핵 에너지를 담은 전투복.',  headColor: 0xff88dd, bodyColor: 0x330022, priceCrystals: 200, priceGold: null },
  { id: 'kaira_arc',    charId: 'kaira', name: '아크 전투복',   description: '아크 에너지로 강화된 전투복.',   headColor: 0x44aaff, bodyColor: 0x001133, priceCrystals: null, priceGold: 400 },
  { id: 'sera_nature',  charId: 'sera',  name: '자연 전투복',   description: '생태계의 기운을 담은 전투복.',   headColor: 0x88ff44, bodyColor: 0x0a2200, priceCrystals: 200, priceGold: null },
  { id: 'zei_storm',    charId: 'zei',   name: '폭풍 전투복',   description: '전기 에너지로 강화된 전투복.',   headColor: 0xffee44, bodyColor: 0x221100, priceCrystals: 200, priceGold: null },
  { id: 'aina_neon',    charId: 'aina',  name: '네온 전투복',   description: '사이버 네온 도장 전투복.',       headColor: 0xff44aa, bodyColor: 0x330011, priceCrystals: 200, priceGold: null },
  { id: 'dex_steel',    charId: 'dex',   name: '강철 전투복',   description: '철광석 합금으로 제작된 전투복.', headColor: 0xaaaaaa, bodyColor: 0x222222, priceCrystals: 200, priceGold: null },
  { id: 'luka_space',   charId: 'luka',  name: '우주 전투복',   description: '성운 에너지를 흡수하는 전투복.', headColor: 0x8844ff, bodyColor: 0x110033, priceCrystals: 200, priceGold: null },
  { id: 'orion_cyber',  charId: 'orion', name: '사이버 전투복', description: '연방 정보국 특수 전투복.',       headColor: 0x44ffee, bodyColor: 0x002222, priceCrystals: 200, priceGold: null },
]

export const WEAPON_SHOP_PRICE = 120  // 3성 무기 직구 가격 (파편)

// ── 무기 풀 ────────────────────────────────────────────────
export const WEAPONS_3STAR: Weapon[] = [
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
  { name: '별빛 반지',       desc: '고대 별빛을 담은 반지. 착용자의 잠재력을 끌어올린다.' },
  { name: '크리스탈 목걸이', desc: '행성 내부 결정으로 만든 목걸이. 신체 능력을 강화한다.' },
  { name: '에너지 팔찌',     desc: '압축 에너지를 순환시켜 전투력을 높인다.' },
  { name: '코어 이어링',     desc: '행성 코어 파편을 세공한 귀걸이. 집중력을 향상시킨다.' },
  { name: '플라즈마 밴드',   desc: '플라즈마 에너지를 피부에 전달해 능력치를 강화한다.' },
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
  const shuffled = [...ALL_STATS].sort(() => Math.random() - 0.5)
  const stats: AccessoryStatEntry[] = shuffled.slice(0, is5Star ? 2 : 1).map((stat) => ({
    stat, value: STAT_VALUES[stat][rarity],
  }))
  return { id: `acc_${Date.now()}_${idx}`, name: base.name, rarity, stats, description: base.desc }
}

function calcExpToNext(level: number) {
  return Math.floor(100 * Math.pow(1.4, level - 1))
}

const EMPTY_STATS: Record<AccessoryStat, number> = {
  critRate: 0, critDmg: 0, atk: 0, def: 0, hp: 0, skillSpeed: 0, moveSpeed: 0,
}

export const EXCHANGE_RATES = {
  shardsToGold: { shards: 50, gold: 500 },
  shardsToWeapon3: { shards: 30 },
  shardsToExpItem: { shards: 20, expValue: 150 },
}

// ── 초기 우편 ──────────────────────────────────────────────
const INITIAL_MAIL: MailItem[] = [
  {
    id: 'mail_starter_tickets',
    title: '🎫 신규 요원 상시 뽑기권 10장 지급',
    from: 'CALORIA SYSTEM',
    body: '칼로리아에 오신 것을 환영합니다!\n상시 소환에서 바로 사용할 수 있는 뽑기권 10장을 지급합니다.',
    rewards: [
      { type: 'standardTicket', amount: 10 },
    ],
    claimed: false,
    createdAt: Date.now(),
  },
  {
    id: 'mail_welcome',
    title: '✦ 칼로리아에 오신 것을 환영합니다!',
    from: 'CALORIA SYSTEM',
    body: '행성 탐사 임무에 파견된 여러분을 환영합니다.\n초보 요원 지원 물자를 지급합니다.',
    rewards: [
      { type: 'crystals', amount: 200 },
      { type: 'limitedCrystals', amount: 150 },
    ],
    claimed: false,
    createdAt: Date.now(),
  },
  {
    id: 'mail_first_login',
    title: '첫 접속 보상',
    from: 'CALORIA SYSTEM',
    body: '첫 접속을 기념하여 성장 지원 물자를 지급합니다.\n열심히 운동하세요!',
    rewards: [
      { type: 'expItem', item: { id: 'mail_ei_1', type: 'instant', name: '고급 성장 코어', value: 200 } },
      { type: 'gold', amount: 500 },
    ],
    claimed: false,
    createdAt: Date.now(),
  },
  {
    id: 'mail_limited_event',
    title: '★ 한정 이벤트 — 닉스 등장',
    from: 'EVENT TEAM',
    body: '사이버 침투 전문가 닉스가 한정 포탈에 등장했습니다.\n한정 뽑기권과 별조각을 지급합니다. 놓치지 마세요!',
    rewards: [
      { type: 'limitedTicket', amount: 5 },
      { type: 'shards', amount: 40 },
    ],
    claimed: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  },
]

// ── 초기 공지 ──────────────────────────────────────────────
const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'notice_welcome',
    type: 'system',
    title: '📢 CALORIA 서비스 시작 안내',
    body: '칼로리아 베타 서비스를 시작합니다.\n운동을 하며 캐릭터를 성장시키고 던전을 탐험하세요.\n다양한 캐릭터와 무기를 수집해 나만의 파티를 구성할 수 있습니다.',
    createdAt: Date.now(),
    read: false,
  },
  {
    id: 'notice_limited_banner',
    type: 'event',
    title: '★ 한정 이벤트 — 닉스 & 솔 등장',
    body: '한정 캐릭터 닉스(사이버)와 솔(플라즈마)이 등장했습니다!\n한정 소환 배너에서 별조각 또는 한정 뽑기권으로 도전하세요.\n닉스는 피처드 50% 확률로 획득 가능합니다.\n\n기간: 한정 운영 중',
    createdAt: Date.now() - 1000 * 60 * 60,
    read: false,
  },
  {
    id: 'notice_system_guide',
    type: 'update',
    title: '🔧 게임 가이드',
    body: '■ 운동 포즈로 공격\n  스쿼트 → 그라운드 크래시\n  플랭크 → 사이버 해킹\n  점프 → 파쿠르 도약\n\n■ 재화 안내\n  ◈ 크리스탈: 상시 소환, 아이템 구매\n  ★ 별조각: 한정 소환\n  🔷 파편: 교환소에서 다양한 아이템으로 교환\n  🪙 골드: 스킨 및 상점 아이템 구매\n\n■ 악세서리는 캐릭터별 최대 2개 장착 가능합니다.',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    read: false,
  },
]

// ── GameState 인터페이스 ───────────────────────────────────
interface GameState {
  screen: Screen
  prevScreen: Screen | null
  selectedCharacters: CharacterId[]
  characters: Character[]
  unlockedCharacters: CharacterId[]
  activeCharIndex: number

  playerLevel: number
  playerExp: number
  expToNextLevel: number

  exerciseSeconds: number
  lastWarningAt: number

  crystals: number
  limitedCrystals: number
  shards: number
  gold: number
  standardTickets: number
  limitedTickets: number
  activeBooster: { multiplier: number; endsAt: number } | null
  inventory: Weapon[]
  accessories: Accessory[]
  equippedAccessories: Partial<Record<CharacterId, string[]>>
  expItems: ExpItem[]
  ownedSkins: string[]
  equippedSkins: Partial<Record<CharacterId, string>>
  equippedWeapons: Partial<Record<CharacterId, string>>
  mailbox: MailItem[]

  partyHp: Array<{ cur: number; max: number }>
  notices: NoticeItem[]

  setScreen: (screen: Screen) => void
  goBack: () => void
  buyTickets: (banner: 'standard' | 'limited', count: 1 | 10) => boolean
  equipWeapon: (charId: CharacterId, weaponId: string) => void
  unequipWeapon: (charId: CharacterId) => void
  buyWeapon3: (baseId: string) => boolean
  toggleCharacter: (id: CharacterId) => void
  swapIanGender: () => void
  setActiveCharIndex: (i: number) => void
  addExp: (amount: number) => void
  addCrystals: (amount: number) => void
  addLimitedCrystals: (amount: number) => void
  addGold: (amount: number) => void
  addShards: (amount: number) => void
  tickExercise: () => void
  activateBooster: (multiplier: number, durationMin: number) => void
  pull: (type: 'weapon' | 'char', count: 1 | 10, banner?: 'standard' | 'limited', payWith?: 'currency' | 'ticket') => GachaResult[] | null
  useExpItem: (id: string) => void
  equipAccessory: (charId: CharacterId, id: string) => void
  unequipAccessory: (charId: CharacterId, id: string) => void
  getEquippedStats: (charId: CharacterId) => Record<AccessoryStat, number>
  initPartyHp: (count: number) => void
  damagePartyMember: (idx: number, dmg: number) => void
  exchangeShards: (to: 'gold' | 'weapon3' | 'expItem') => boolean
  buySkin: (skinId: string, currency: 'crystals' | 'gold') => boolean
  equipSkin: (charId: CharacterId, skinId: string | null) => void
  claimMail: (id: string) => void
  claimAllMail: () => void
  addMail: (mail: Omit<MailItem, 'id' | 'claimed' | 'createdAt'>) => void
  readNotice: (id: string) => void
  readAllNotices: () => void
  addNotice: (notice: Omit<NoticeItem, 'id' | 'read' | 'createdAt'>) => void
}

// ── 스토어 ────────────────────────────────────────────────
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'title',
      prevScreen: null,
      selectedCharacters: [],
      characters: CHARACTERS,
      unlockedCharacters: ['ian_m', 'ian_f'],
      activeCharIndex: 0,

      playerLevel: 1,
      playerExp: 0,
      expToNextLevel: calcExpToNext(1),

      exerciseSeconds: 0,
      lastWarningAt: 0,

      crystals: 160,
      limitedCrystals: 0,
      shards: 0,
      gold: 0,
      standardTickets: 0,
      limitedTickets: 0,
      activeBooster: null,
      inventory: [],
      accessories: [],
      equippedAccessories: {},
      expItems: [
        { id: 'ei_start_1', type: 'instant', name: '성장의 코어',    value: 50 },
        { id: 'ei_start_2', type: 'instant', name: '성장의 코어',    value: 50 },
        { id: 'ei_start_3', type: 'instant', name: '고급 성장 코어', value: 200 },
      ],
      ownedSkins: [],
      equippedSkins: {},
      equippedWeapons: {},
      mailbox: INITIAL_MAIL,
      notices: INITIAL_NOTICES,
      partyHp: [],

      setScreen: (screen) => set((s) => ({ prevScreen: s.screen, screen })),
      goBack: () => set((s) => ({ screen: s.prevScreen ?? 'character_select', prevScreen: null })),
      equipWeapon: (charId, weaponId) => set((s) => ({ equippedWeapons: { ...s.equippedWeapons, [charId]: weaponId } })),
      unequipWeapon: (charId) => set((s) => {
        const next = { ...s.equippedWeapons }
        delete next[charId]
        return { equippedWeapons: next }
      }),
      buyWeapon3: (baseId) => {
        const { shards } = get()
        if (shards < WEAPON_SHOP_PRICE) return false
        const base = WEAPONS_3STAR.find((w) => w.id === baseId)
        if (!base) return false
        const weapon: Weapon = { ...base, id: `${base.id}_shop_${Date.now()}` }
        set((s) => ({ shards: s.shards - WEAPON_SHOP_PRICE, inventory: [...s.inventory, weapon] }))
        return true
      },
      buyTickets: (banner, count) => {
        const { crystals, limitedCrystals } = get()
        const cost = count === 1 ? PULL_COST_1 : PULL_COST_10
        if (banner === 'standard') {
          if (crystals < cost) return false
          set((s) => ({ crystals: s.crystals - cost, standardTickets: s.standardTickets + count }))
        } else {
          if (limitedCrystals < cost) return false
          set((s) => ({ limitedCrystals: s.limitedCrystals - cost, limitedTickets: s.limitedTickets + count }))
        }
        return true
      },

      toggleCharacter: (id) => {
        const { selectedCharacters } = get()
        const otherIan = id === 'ian_m' ? 'ian_f' : id === 'ian_f' ? 'ian_m' : null
        if (selectedCharacters.includes(id)) {
          set({ selectedCharacters: selectedCharacters.filter((c) => c !== id), activeCharIndex: 0 })
        } else if (otherIan && selectedCharacters.includes(otherIan)) {
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

      setActiveCharIndex: (i) => {
        const { selectedCharacters } = get()
        set({ activeCharIndex: Math.max(0, Math.min(i, selectedCharacters.length - 1)) })
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
      addLimitedCrystals: (amount) => set((s) => ({ limitedCrystals: s.limitedCrystals + amount })),
      addGold: (amount) => set((s) => ({ gold: s.gold + amount })),
      addShards: (amount) => set((s) => ({ shards: s.shards + amount })),

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

      pull: (type, count, banner = 'standard', payWith = 'currency') => {
        const { crystals, limitedCrystals, standardTickets, limitedTickets, unlockedCharacters } = get()
        const totalCost = count === 1 ? PULL_COST_1 : PULL_COST_10
        const useLimited = banner === 'limited'

        if (payWith === 'ticket') {
          const available = useLimited ? limitedTickets : standardTickets
          if (available < count) return null
        } else {
          if (useLimited && limitedCrystals < totalCost) return null
          if (!useLimited && crystals < totalCost) return null
        }

        const results: GachaResult[] = []
        const newWeapons: Weapon[] = []
        const newAccessories: Accessory[] = []
        const newUnlocked = [...unlockedCharacters]
        let totalShardComp = 0

        const accDropRate = type === 'weapon' ? 0.20 : useLimited ? 0.25 : 0.15

        for (let i = 0; i < count; i++) {
          if (Math.random() < accDropRate) {
            const acc = rollAccessory(i)
            newAccessories.push(acc)
            results.push({ type: 'accessory', item: acc, isNew: true, crystalComp: 0, shardComp: 0 })
            continue
          }

          if (type === 'weapon') {
            const pool = Math.random() < 0.15 ? WEAPONS_4STAR : WEAPONS_3STAR
            const base = pool[Math.floor(Math.random() * pool.length)]
            const weapon: Weapon = { ...base, id: `${base.id}_${Date.now()}_${i}` }
            newWeapons.push(weapon)
            results.push({ type: 'weapon', item: weapon, isNew: true, crystalComp: 0, shardComp: 0 })
          } else if (useLimited) {
            // 한정 배너: 피처드 캐릭 50%, 나머지 한정 풀 50%
            const charData = Math.random() < 0.50
              ? CHARACTERS.find((c) => c.id === FEATURED_CHAR)!
              : LIMITED_CHARS[Math.floor(Math.random() * LIMITED_CHARS.length)]
            const isNew = !newUnlocked.includes(charData.id)
            if (isNew) {
              newUnlocked.push(charData.id)
              results.push({ type: 'char', item: charData, isNew: true, crystalComp: 0, shardComp: 0 })
            } else {
              totalShardComp += 40
              results.push({ type: 'char', item: charData, isNew: false, crystalComp: 0, shardComp: 40 })
            }
          } else {
            // 상시 배너
            const charData = GACHA_CHARS[Math.floor(Math.random() * GACHA_CHARS.length)]
            const isNew = !newUnlocked.includes(charData.id as CharacterId)
            if (isNew) {
              newUnlocked.push(charData.id as CharacterId)
              results.push({ type: 'char', item: charData, isNew: true, crystalComp: 0, shardComp: 0 })
            } else {
              totalShardComp += 40
              results.push({ type: 'char', item: charData, isNew: false, crystalComp: 0, shardComp: 40 })
            }
          }
        }

        set((s) => ({
          crystals: (payWith === 'currency' && !useLimited) ? s.crystals - totalCost : s.crystals,
          limitedCrystals: (payWith === 'currency' && useLimited) ? s.limitedCrystals - totalCost : s.limitedCrystals,
          standardTickets: (payWith === 'ticket' && !useLimited) ? s.standardTickets - count : s.standardTickets,
          limitedTickets: (payWith === 'ticket' && useLimited) ? s.limitedTickets - count : s.limitedTickets,
          shards: s.shards + totalShardComp,
          inventory: [...s.inventory, ...newWeapons],
          accessories: [...s.accessories, ...newAccessories],
          unlockedCharacters: newUnlocked,
        }))

        return results
      },

      useExpItem: (id) => {
        const { expItems, addExp } = get()
        const item = expItems.find((e) => e.id === id)
        if (!item) return
        addExp(item.value)
        set((s) => ({ expItems: s.expItems.filter((e) => e.id !== id) }))
      },

      equipAccessory: (charId, id) => {
        const { equippedAccessories } = get()
        const slots = equippedAccessories[charId] ?? []
        if (slots.includes(id) || slots.length >= 2) return
        set({ equippedAccessories: { ...equippedAccessories, [charId]: [...slots, id] } })
      },

      unequipAccessory: (charId, id) => {
        set((s) => ({
          equippedAccessories: {
            ...s.equippedAccessories,
            [charId]: (s.equippedAccessories[charId] ?? []).filter((e) => e !== id),
          },
        }))
      },

      getEquippedStats: (charId) => {
        const { equippedAccessories, accessories } = get()
        const slots = equippedAccessories[charId] ?? []
        const stats = { ...EMPTY_STATS }
        slots.forEach((id) => {
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

      exchangeShards: (to) => {
        const { shards } = get()
        if (to === 'gold') {
          const { shards: need, gold: give } = EXCHANGE_RATES.shardsToGold
          if (shards < need) return false
          set((s) => ({ shards: s.shards - need, gold: s.gold + give }))
        } else if (to === 'weapon3') {
          const need = EXCHANGE_RATES.shardsToWeapon3.shards
          if (shards < need) return false
          const pool = WEAPONS_3STAR
          const base = pool[Math.floor(Math.random() * pool.length)]
          const weapon: Weapon = { ...base, id: `${base.id}_ex_${Date.now()}` }
          set((s) => ({ shards: s.shards - need, inventory: [...s.inventory, weapon] }))
        } else if (to === 'expItem') {
          const need = EXCHANGE_RATES.shardsToExpItem.shards
          if (shards < need) return false
          const item: ExpItem = {
            id: `ei_ex_${Date.now()}`,
            type: 'instant',
            name: '파편 압축 코어',
            value: EXCHANGE_RATES.shardsToExpItem.expValue,
          }
          set((s) => ({ shards: s.shards - need, expItems: [...s.expItems, item] }))
        }
        return true
      },

      buySkin: (skinId, currency) => {
        const { crystals, gold, ownedSkins } = get()
        if (ownedSkins.includes(skinId)) return false
        const skin = SKINS.find((s) => s.id === skinId)
        if (!skin) return false
        if (currency === 'crystals') {
          if (!skin.priceCrystals || crystals < skin.priceCrystals) return false
          set((s) => ({ crystals: s.crystals - skin.priceCrystals!, ownedSkins: [...s.ownedSkins, skinId] }))
        } else {
          if (!skin.priceGold || gold < skin.priceGold) return false
          set((s) => ({ gold: s.gold - skin.priceGold!, ownedSkins: [...s.ownedSkins, skinId] }))
        }
        return true
      },

      equipSkin: (charId, skinId) => {
        set((s) => ({
          equippedSkins: skinId
            ? { ...s.equippedSkins, [charId]: skinId }
            : Object.fromEntries(Object.entries(s.equippedSkins).filter(([k]) => k !== charId)) as Partial<Record<CharacterId, string>>,
        }))
      },

      claimMail: (id) => {
        set((state) => {
          const mail = state.mailbox.find((m) => m.id === id)
          if (!mail || mail.claimed) return state

          let crystals = state.crystals
          let limitedCrystals = state.limitedCrystals
          let gold = state.gold
          let shards = state.shards
          let standardTickets = state.standardTickets
          let limitedTickets = state.limitedTickets
          const expItems = [...state.expItems]
          const inventory = [...state.inventory]
          const accessories = [...state.accessories]

          mail.rewards.forEach((reward: MailReward) => {
            if (reward.type === 'crystals') crystals += reward.amount ?? 0
            else if (reward.type === 'limitedCrystals') limitedCrystals += reward.amount ?? 0
            else if (reward.type === 'gold') gold += reward.amount ?? 0
            else if (reward.type === 'shards') shards += reward.amount ?? 0
            else if (reward.type === 'standardTicket') standardTickets += reward.amount ?? 0
            else if (reward.type === 'limitedTicket') limitedTickets += reward.amount ?? 0
            else if (reward.type === 'expItem' && reward.item) expItems.push(reward.item as ExpItem)
            else if (reward.type === 'weapon' && reward.item) inventory.push(reward.item as Weapon)
            else if (reward.type === 'accessory' && reward.item) accessories.push(reward.item as Accessory)
          })

          return {
            crystals, limitedCrystals, gold, shards, standardTickets, limitedTickets,
            expItems, inventory, accessories,
            mailbox: state.mailbox.map((m) => m.id === id ? { ...m, claimed: true } : m),
          }
        })
      },

      claimAllMail: () => {
        set((state) => {
          const unclaimed = state.mailbox.filter((m) => !m.claimed)
          if (unclaimed.length === 0) return state

          let crystals = state.crystals
          let limitedCrystals = state.limitedCrystals
          let gold = state.gold
          let shards = state.shards
          let standardTickets = state.standardTickets
          let limitedTickets = state.limitedTickets
          const expItems = [...state.expItems]
          const inventory = [...state.inventory]
          const accessories = [...state.accessories]

          unclaimed.forEach((mail) => {
            mail.rewards.forEach((reward: MailReward) => {
              if (reward.type === 'crystals') crystals += reward.amount ?? 0
              else if (reward.type === 'limitedCrystals') limitedCrystals += reward.amount ?? 0
              else if (reward.type === 'gold') gold += reward.amount ?? 0
              else if (reward.type === 'shards') shards += reward.amount ?? 0
              else if (reward.type === 'standardTicket') standardTickets += reward.amount ?? 0
              else if (reward.type === 'limitedTicket') limitedTickets += reward.amount ?? 0
              else if (reward.type === 'expItem' && reward.item) expItems.push(reward.item as ExpItem)
              else if (reward.type === 'weapon' && reward.item) inventory.push(reward.item as Weapon)
              else if (reward.type === 'accessory' && reward.item) accessories.push(reward.item as Accessory)
            })
          })

          return {
            crystals, limitedCrystals, gold, shards, standardTickets, limitedTickets,
            expItems, inventory, accessories,
            mailbox: state.mailbox.map((m) => ({ ...m, claimed: true })),
          }
        })
      },

      addMail: (mail) => {
        set((s) => ({
          mailbox: [...s.mailbox, { ...mail, id: `mail_${Date.now()}`, claimed: false, createdAt: Date.now() }],
        }))
      },

      readNotice: (id) => {
        set((s) => ({ notices: s.notices.map((n) => n.id === id ? { ...n, read: true } : n) }))
      },
      readAllNotices: () => {
        set((s) => ({ notices: s.notices.map((n) => ({ ...n, read: true })) }))
      },
      addNotice: (notice) => {
        set((s) => ({
          notices: [{ ...notice, id: `notice_${Date.now()}`, read: false, createdAt: Date.now() }, ...s.notices],
        }))
      },
    }),
    {
      name: 'caloria-ng-v6',
      partialize: (s) => ({
        // 진행도
        playerLevel: s.playerLevel,
        playerExp: s.playerExp,
        expToNextLevel: s.expToNextLevel,
        // 캐릭터
        unlockedCharacters: s.unlockedCharacters,
        selectedCharacters: s.selectedCharacters,
        activeCharIndex: s.activeCharIndex,
        // 재화
        crystals: s.crystals,
        limitedCrystals: s.limitedCrystals,
        shards: s.shards,
        gold: s.gold,
        standardTickets: s.standardTickets,
        limitedTickets: s.limitedTickets,
        // 아이템
        inventory: s.inventory,
        accessories: s.accessories,
        equippedAccessories: s.equippedAccessories,
        equippedWeapons: s.equippedWeapons,
        expItems: s.expItems,
        // 스킨
        ownedSkins: s.ownedSkins,
        equippedSkins: s.equippedSkins,
        // 우편
        mailbox: s.mailbox,
        // 공지
        notices: s.notices,
        // HP
        partyHp: s.partyHp,
        // 화면 (title 제외, 실제 진행 중인 화면 복원)
        screen: s.screen === 'title' ? 'title' : s.screen,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (state.selectedCharacters.length > 0 && state.screen === 'title') {
          state.screen = 'character_select'
        }
      },
    }
  )
)

export { PULL_COST_1, PULL_COST_10 }
