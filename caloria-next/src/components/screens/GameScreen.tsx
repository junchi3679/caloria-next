import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import HUD from '../hud/HUD'
import GameScene from '../../three/GameScene'
import PoseCamera from '../ar/PoseCamera'
import type { DetectedPose } from '../ar/PoseCamera'

const SKILL_BY_POSE: Record<DetectedPose, string> = {
  squat: '그라운드 크래시',
  plank: '사이버 해킹',
  jump: '파쿠르 도약',
  none: '',
}

export default function GameScreen() {
  const { tickExercise, setScreen, selectedCharacter, characters, addExp } = useGameStore()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [activePose, setActivePose] = useState<DetectedPose>('none')
  const [skillFlash, setSkillFlash] = useState('')

  const char = characters.find((c) => c.id === selectedCharacter)

  useEffect(() => {
    tickRef.current = setInterval(() => tickExercise(), 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [tickExercise])

  function handlePose(pose: DetectedPose) {
    setActivePose(pose)
    if (pose !== 'none') {
      const skill = SKILL_BY_POSE[pose]
      setSkillFlash(skill)
      setTimeout(() => setSkillFlash(''), 2000)
    }
  }

  return (
    <div className="fixed inset-0" style={{ background: '#040e1a' }}>
      {/* Three.js 3D 씬 */}
      <div className="absolute inset-0">
        <GameScene attribute={char?.attribute ?? 'arc'} />
      </div>

      {/* HUD */}
      <HUD />

      {/* 스킬 발동 플래시 */}
      {skillFlash && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none fade-in-down">
          <div
            className="font-hud text-xl px-8 py-4 text-glow"
            style={{ background: 'rgba(0,20,40,0.7)', border: '1px solid rgba(0,212,255,0.5)', letterSpacing: '0.1em' }}
          >
            ◈ {skillFlash}
          </div>
        </div>
      )}

      {/* 우하단 — AR 카메라 패널 */}
      <div className="fixed bottom-16 right-4 z-40">
        <div className="sf-panel overflow-hidden" style={{ width: 200, border: '1px solid rgba(0,212,255,0.25)' }}>
          <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: 'rgba(0,212,255,0.07)', borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full pulse" style={{ background: activePose !== 'none' ? '#00ff88' : 'rgba(0,212,255,0.4)' }} />
            <span className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.7)', letterSpacing: '0.1em' }}>AR POSE</span>
          </div>
          <div style={{ height: 150 }}>
            <PoseCamera onPose={handlePose} minimized />
          </div>
          <div className="px-3 py-1.5 text-xs" style={{ color: 'rgba(0,212,255,0.4)', borderTop: '1px solid rgba(0,212,255,0.1)' }}>
            <div className="font-hud" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>DETECTED POSES</div>
            <div className="mt-0.5">스쿼트 · 플랭크 · 점프</div>
          </div>
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="sf-panel px-6 py-3 flex items-center gap-6">
          <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.1em' }}>
            ARID-9 · WORLD 01
          </div>
          <div className="h-4 w-px" style={{ background: 'rgba(0,212,255,0.2)' }} />
          <div className="flex gap-5 text-xs" style={{ color: 'rgba(224,240,255,0.5)' }}>
            <span><span className="font-hud" style={{ color: 'var(--sf-primary)' }}>MOVE</span> 달리기</span>
            <span><span className="font-hud" style={{ color: 'var(--sf-primary)' }}>SKILL</span> 운동 자세</span>
            <span><span className="font-hud" style={{ color: 'var(--sf-primary)' }}>AR</span> 자세 인식</span>
          </div>
          <div className="h-4 w-px" style={{ background: 'rgba(0,212,255,0.2)' }} />
          <button
            className="font-hud text-xs px-3 py-1 transition-colors"
            style={{ border: '1px solid rgba(255,107,53,0.4)', color: 'rgba(255,107,53,0.7)', cursor: 'pointer' }}
            onClick={() => setScreen('character_select')}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sf-accent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,107,53,0.7)' }}
          >
            MENU
          </button>
        </div>
      </div>
    </div>
  )
}
