import { create } from 'zustand'
import type { Screen, CharacterId, Character } from '../types'

const CHARACTERS: Character[] = [
  { id: 'ian_m',  name: '이안 (남)',  gender: 'male',   attribute: 'arc',    exercise: '달리기 / 파쿠르',     description: '기후복원 프로젝트 단독 파견 요원. 임무를 최우선으로 한다.', color: '#00d4ff' },
  { id: 'ian_f',  name: '이안 (여)',  gender: 'female', attribute: 'arc',    exercise: '달리기 / 파쿠르',     description: '기후복원 프로젝트 단독 파견 요원. 임무를 최우선으로 한다.', color: '#00d4ff' },
  { id: 'kaira',  name: '카이라',     gender: 'female', attribute: 'plasma', exercise: '스쿼트 / 근력',       description: '전직 행성 방위군. 혼자 폐허를 순찰하며 속죄 중.', color: '#ff4466' },
  { id: 'sera',   name: '세라',       gender: 'female', attribute: 'bio',    exercise: '요가 / 스트레칭',     description: '생태 복원 연구원. 고립된 기지에서 데이터를 수집 중.', color: '#44ff88' },
  { id: 'zei',    name: '제이',       gender: 'female', attribute: 'cryo',   exercise: '장거리 달리기',       description: '화물선 조종사. 3개월째 행성을 홀로 횡단 중.', color: '#44aaff' },
  { id: 'aina',   name: '아이나',     gender: 'female', attribute: 'cyber',  exercise: '플랭크 / 코어',       description: '시스템 엔지니어. 프리즈 코드의 배후를 추적 중.', color: '#aa44ff' },
  { id: 'dex',    name: '덱스',       gender: 'male',   attribute: 'plasma', exercise: '데드리프트 / 푸시업', description: '개척 노동자. 고향 행성이 사막이 되어 원인을 찾아 떠남.', color: '#ff8844' },
  { id: 'luka',   name: '루카',       gender: 'male',   attribute: 'cryo',   exercise: '버피 / 인터벌',       description: '전 은하계 마라톤 챔피언. 레이스 도중 불시착.', color: '#44ffdd' },
  { id: 'orion',  name: '오리온',     gender: 'male',   attribute: 'cyber',  exercise: '밸런스 / 코어',       description: '연방 정보 분석관. 질서 동맹을 수년간 단독 추적 중.', color: '#cc88ff' },
]

interface GameState {
  screen: Screen
  selectedCharacter: CharacterId | null
  characters: Character[]

  // 플레이어 성장
  playerLevel: number
  playerExp: number
  expToNextLevel: number

  // 운동 시간 추적 (초)
  exerciseSeconds: number
  lastWarningAt: number

  // 부스터
  activeBooster: { multiplier: number; endsAt: number } | null

  setScreen: (screen: Screen) => void
  selectCharacter: (id: CharacterId) => void
  addExp: (amount: number) => void
  tickExercise: () => void
  activateBooster: (multiplier: number, durationMin: number) => void
}

function calcExpToNext(level: number) {
  return Math.floor(100 * Math.pow(1.25, level - 1))
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'title',
  selectedCharacter: null,
  characters: CHARACTERS,

  playerLevel: 1,
  playerExp: 0,
  expToNextLevel: calcExpToNext(1),

  exerciseSeconds: 0,
  lastWarningAt: 0,

  activeBooster: null,

  setScreen: (screen) => set({ screen }),

  selectCharacter: (id) => set({ selectedCharacter: id }),

  addExp: (baseAmount) => {
    const { activeBooster, playerLevel, playerExp, expToNextLevel } = get()
    const now = Date.now()
    const multiplier = activeBooster && activeBooster.endsAt > now
      ? activeBooster.multiplier
      : 1
    const amount = Math.floor(baseAmount * multiplier)

    let newExp = playerExp + amount
    let newLevel = playerLevel
    let newExpToNext = expToNextLevel

    while (newExp >= newExpToNext) {
      newExp -= newExpToNext
      newLevel++
      newExpToNext = calcExpToNext(newLevel)
    }

    set({ playerExp: newExp, playerLevel: newLevel, expToNextLevel: newExpToNext })
  },

  tickExercise: () => {
    const { exerciseSeconds, lastWarningAt, addExp } = get()
    const next = exerciseSeconds + 1

    // 1분마다 10 EXP
    if (next % 60 === 0) addExp(10)

    set({
      exerciseSeconds: next,
      lastWarningAt:
        next - lastWarningAt >= 3600 && next > 0
          ? next
          : lastWarningAt,
    })
  },

  activateBooster: (multiplier, durationMin) => {
    set({ activeBooster: { multiplier, endsAt: Date.now() + durationMin * 60 * 1000 } })
  },
}))

export { CHARACTERS }
