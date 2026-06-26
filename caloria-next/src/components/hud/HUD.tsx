import { useGameStore } from '../../store/gameStore'
import ExerciseWarning from './ExerciseWarning'

const ATTR_LABEL: Record<string, string> = {
  arc: 'ARC', plasma: 'PLASMA', bio: 'BIO', cryo: 'CRYO', cyber: 'CYBER',
}
const LEVEL_TIER: Record<number, string> = {
  1: 'NOVICE', 11: 'TRAINEE', 21: 'SKILLED', 41: 'EXPERT', 61: 'MASTER',
}

function getTier(level: number) {
  const keys = Object.keys(LEVEL_TIER).map(Number).sort((a, b) => b - a)
  return LEVEL_TIER[keys.find((k) => level >= k) ?? 1]
}

function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function HUD() {
  const { playerLevel, playerExp, expToNextLevel, exerciseSeconds, selectedCharacter, characters, activeBooster } =
    useGameStore()

  const char = characters.find((c) => c.id === selectedCharacter)
  const expPct = Math.min((playerExp / expToNextLevel) * 100, 100)
  const now = Date.now()
  const boosterActive = activeBooster && activeBooster.endsAt > now

  return (
    <>
      <ExerciseWarning />

      {/* 좌상단 — 플레이어 정보 */}
      <div className="fixed top-4 left-4 z-40">
        <div className="sf-panel px-4 py-3 holo-flicker" style={{ minWidth: 220 }}>
          {/* 레벨 & 티어 */}
          <div className="flex items-center gap-2 mb-2">
            <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.6)' }}>LV</div>
            <div className="font-hud text-2xl text-glow leading-none">{playerLevel}</div>
            <div
              className="font-hud text-xs px-1.5 py-0.5 ml-1"
              style={{ border: '1px solid rgba(0,212,255,0.3)', color: 'rgba(0,212,255,0.7)' }}
            >
              {getTier(playerLevel)}
            </div>
          </div>

          {/* EXP 바 */}
          <div className="mb-1">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(0,212,255,0.6)' }}>
              <span className="font-hud">EXP</span>
              <span>{playerExp} / {expToNextLevel}</span>
            </div>
            <div className="h-1.5 w-full rounded-none" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <div className="exp-bar-fill h-full" style={{ width: `${expPct}%` }} />
            </div>
          </div>

          {/* 운동 시간 */}
          <div className="flex items-center gap-2 mt-2">
            <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.5)' }}>TIME</div>
            <div className="font-hud text-sm" style={{ color: '#00d4ff' }}>{fmtTime(exerciseSeconds)}</div>
          </div>

          {/* 부스터 활성 표시 */}
          {boosterActive && (
            <div className="mt-2 px-2 py-1 text-xs font-hud pulse"
              style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.4)', color: 'var(--sf-accent)' }}>
              BOOST ×{activeBooster!.multiplier}
            </div>
          )}
        </div>
      </div>

      {/* 우상단 — 캐릭터 속성 */}
      {char && (
        <div className="fixed top-4 right-4 z-40">
          <div className="sf-panel px-4 py-3 text-right holo-flicker">
            <div className="font-hud text-lg leading-none mb-1" style={{ color: char.color }}>
              {char.name}
            </div>
            <div
              className="font-hud text-xs inline-block px-2 py-0.5"
              style={{ border: `1px solid ${char.color}40`, color: char.color, background: `${char.color}12` }}
            >
              {ATTR_LABEL[char.attribute]}
            </div>
            <div className="text-xs mt-1.5" style={{ color: 'rgba(224,240,255,0.5)' }}>
              {char.exercise}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
