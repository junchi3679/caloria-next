import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import HUD from '../hud/HUD'
import Bag from '../hud/Bag'
import MiniMap from '../hud/MiniMap'
import CharacterSwapPanel from '../hud/CharacterSwapPanel'
import PartySlots from '../hud/PartySlots'
import Mailbox from '../hud/Mailbox'
import Notice from '../hud/Notice'
import GameScene from '../../three/GameScene'
import PoseCamera from '../ar/PoseCamera'
import Compass from '../hud/Compass'
import type { DetectedPose, MovementState } from '../ar/PoseCamera'
import type { MapSnapshot } from '../../types'

const SKILL_BY_POSE: Record<DetectedPose, string> = {
  squat: '그라운드 크래시', plank: '사이버 해킹', jump: '파쿠르 도약', none: '',
}

const EMPTY_MAP: MapSnapshot = { px: 0, pz: 0, pa: Math.PI, enemies: [] }

export default function GameScreen() {
  const { tickExercise, setScreen, selectedCharacters, crystals, gold, equippedSkins, mailbox, standardTickets, limitedTickets, notices } = useGameStore()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [skillFlash, setSkillFlash] = useState('')
  const [bagOpen, setBagOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const [mailOpen, setMailOpen] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const unreadMail = mailbox.filter((m) => !m.claimed).length
  const unreadNotice = notices.filter((n) => !n.read).length

  const movementRef = useRef<MovementState>({ moving: false, direction: 'forward', speed: 0 })
  const compassRef = useRef<number>(0)
  const attackEventRef = useRef<{ pose: DetectedPose; seq: number }>({ pose: 'none', seq: 0 })
  const mapRef = useRef<MapSnapshot>(EMPTY_MAP)

  // Key that changes when skin is equipped — triggers GameScene re-mount
  const equippedSkinsKey = JSON.stringify(equippedSkins)

  useEffect(() => {
    tickRef.current = setInterval(() => tickExercise(), 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [tickExercise])

  function handlePose(pose: DetectedPose) {
    if (pose !== 'none') {
      setSkillFlash(SKILL_BY_POSE[pose])
      setTimeout(() => setSkillFlash(''), 2000)
      attackEventRef.current = { pose, seq: attackEventRef.current.seq + 1 }
    }
  }

  return (
    <div className="fixed inset-0" style={{ background: '#07001a' }}>
      {/* Three.js 3D 씬 */}
      <div className="absolute inset-0">
        <GameScene
          selectedCharacters={selectedCharacters}
          equippedSkinsKey={equippedSkinsKey}
          movementRef={movementRef}
          compassRef={compassRef}
          attackEventRef={attackEventRef}
          mapRef={mapRef}
        />
      </div>

      {/* HUD (상단 상태 + 파티 HP 표시) */}
      <HUD onOpenSwap={() => setSwapOpen(true)} />

      {/* 스킬 발동 플래시 */}
      {skillFlash && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none fade-in-down">
          <div
            className="font-hud text-xl px-8 py-4 text-glow"
            style={{ background: 'rgba(0,20,40,0.75)', border: '1px solid rgba(0,212,255,0.5)', letterSpacing: '0.1em' }}
          >
            ◈ {skillFlash}
          </div>
        </div>
      )}

      {/* 우하단 — AR 카메라 패널 */}
      <div className="fixed bottom-16 right-4 z-40">
        <div className="sf-panel overflow-hidden" style={{ width: 208 }}>
          <div className="px-3 py-1.5 flex items-center gap-2"
            style={{ background: 'rgba(0,212,255,0.07)', borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full pulse" style={{ background: 'rgba(0,212,255,0.4)' }} />
            <span className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.7)', letterSpacing: '0.1em' }}>AR POSE · MOVE</span>
          </div>
          <PoseCamera onPose={handlePose} movementRef={movementRef} minimized />
        </div>
      </div>

      {/* 나침반 */}
      <div className="fixed z-40" style={{ top: 150, right: 16 }}>
        <Compass compassRef={compassRef} />
      </div>

      {/* 오른쪽 중간 — 파티 슬롯 */}
      <div className="fixed z-40" style={{ top: '50%', right: 16, transform: 'translateY(-50%)' }}>
        <PartySlots />
      </div>

      {/* 왼쪽 중간 — 미니맵 */}
      <div className="fixed z-40" style={{ top: 'calc(50% - 60px)', left: 12, transform: 'translateY(-50%)' }}>
        <MiniMap mapRef={mapRef} />
      </div>

      {/* 상단 중앙 — 재화 + 이동 인디케이터 + 가방 */}
      <div className="fixed z-40 flex items-center gap-2" style={{ top: 12, left: '50%', transform: 'translateX(-50%)' }}>
        {/* 이동 인디케이터 */}
        <MoveIndicator movementRef={movementRef} />

        {/* 재화 */}
        <div className="sf-panel flex flex-col gap-1 px-3 py-2" style={{ minWidth: 90 }}>
          <div className="flex items-center gap-1.5">
            <span className="font-hud" style={{ fontSize: '0.75rem', color: '#aa44ff' }}>◈</span>
            <span className="font-hud text-sm" style={{ color: '#cc88ff' }}>{crystals.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '0.7rem' }}>🪙</span>
            <span className="font-hud text-sm" style={{ color: '#ffd700' }}>{gold.toLocaleString()}</span>
          </div>
        </div>

        {/* 가방 버튼 */}
        <button
          onClick={() => setBagOpen(true)}
          className="sf-panel flex flex-col items-center px-3 py-2 gap-1"
          style={{ cursor: 'pointer', minWidth: 48 }}
        >
          <span style={{ fontSize: '1rem', color: '#00d4ff' }}>🎒</span>
          <span className="font-hud" style={{ fontSize: '0.5rem', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.08em' }}>BAG</span>
        </button>

        {/* 우편함 버튼 */}
        <button
          onClick={() => setMailOpen(true)}
          className="sf-panel flex flex-col items-center px-3 py-2 gap-1"
          style={{ cursor: 'pointer', minWidth: 48, position: 'relative' }}
        >
          <span style={{ fontSize: '1rem' }}>📬</span>
          <span className="font-hud" style={{ fontSize: '0.5rem', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.08em' }}>MAIL</span>
          {unreadMail > 0 && (
            <div className="absolute font-hud" style={{ top: -4, right: -4, background: '#ff4466', color: '#fff', fontSize: '0.5rem', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unreadMail}
            </div>
          )}
        </button>

        {/* 뽑기 포탈 버튼 */}
        <button
          onClick={() => setScreen('gacha')}
          className="sf-panel flex flex-col items-center px-3 py-2 gap-1"
          style={{ cursor: 'pointer', minWidth: 48, position: 'relative', borderColor: 'rgba(170,68,255,0.4)' }}
        >
          <span style={{ fontSize: '1rem' }}>🎰</span>
          <span className="font-hud" style={{ fontSize: '0.5rem', color: 'rgba(170,68,255,0.8)', letterSpacing: '0.08em' }}>PORTAL</span>
          {(standardTickets + limitedTickets) > 0 && (
            <div className="absolute font-hud" style={{ top: -4, right: -4, background: '#aa44ff', color: '#fff', fontSize: '0.5rem', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {standardTickets + limitedTickets}
            </div>
          )}
        </button>

        {/* 공지 버튼 */}
        <button
          onClick={() => setNoticeOpen(true)}
          className="sf-panel flex flex-col items-center px-3 py-2 gap-1"
          style={{ cursor: 'pointer', minWidth: 48, position: 'relative', borderColor: 'rgba(255,204,0,0.3)' }}
        >
          <span style={{ fontSize: '1rem' }}>📢</span>
          <span className="font-hud" style={{ fontSize: '0.5rem', color: 'rgba(255,204,0,0.8)', letterSpacing: '0.08em' }}>NOTICE</span>
          {unreadNotice > 0 && (
            <div className="absolute font-hud" style={{ top: -4, right: -4, background: '#ffcc00', color: '#000', fontSize: '0.5rem', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {unreadNotice}
            </div>
          )}
        </button>
      </div>

      {bagOpen && <Bag onClose={() => setBagOpen(false)} />}
      {swapOpen && <CharacterSwapPanel onClose={() => setSwapOpen(false)} />}
      {mailOpen && <Mailbox onClose={() => setMailOpen(false)} />}
      {noticeOpen && <Notice onClose={() => setNoticeOpen(false)} />}

      {/* 하단 컨트롤 바 */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="sf-panel px-6 py-3 flex items-center gap-4">
          <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.1em' }}>
            ARID-9 · WORLD 01
          </div>
          <div className="h-4 w-px" style={{ background: 'rgba(0,212,255,0.2)' }} />
          <div className="flex gap-4 text-xs" style={{ color: 'rgba(224,240,255,0.5)' }}>
            <span><span className="font-hud" style={{ color: 'var(--sf-primary)' }}>제자리 걸음</span> 이동</span>
            <span><span className="font-hud" style={{ color: 'var(--sf-primary)' }}>몸 기울기</span> 방향</span>
            <span><span className="font-hud" style={{ color: 'var(--sf-primary)' }}>운동 자세</span> 공격</span>
          </div>
          <div className="h-4 w-px" style={{ background: 'rgba(0,212,255,0.2)' }} />
          <button
            className="font-hud text-xs px-3 py-1"
            style={{ border: '1px solid rgba(0,212,255,0.4)', color: 'rgba(0,212,255,0.7)', cursor: 'pointer' }}
            onClick={() => setSwapOpen(true)}
          >
            PARTY
          </button>
          <button
            className="font-hud text-xs px-3 py-1"
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

function MoveIndicator({ movementRef }: { movementRef: React.MutableRefObject<MovementState> }) {
  const [ms, setMs] = useState<MovementState>({ moving: false, direction: 'forward', speed: 0 })

  useEffect(() => {
    const id = setInterval(() => setMs({ ...movementRef.current }), 100)
    return () => clearInterval(id)
  }, [movementRef])

  const DIR_ARROW: Record<string, string> = { forward: '▲', left: '◀', right: '▶' }
  const color = ms.moving ? 'var(--sf-primary)' : 'rgba(0,212,255,0.25)'

  return (
    <div className="sf-panel flex items-center gap-2 px-3 py-2">
      <div className="font-hud text-lg transition-colors" style={{ color, lineHeight: 1 }}>{DIR_ARROW[ms.direction]}</div>
      <div className="flex flex-col leading-none">
        <div className="font-hud" style={{ fontSize: '0.55rem', color: 'rgba(0,212,255,0.4)', letterSpacing: '0.1em' }}>MOVE</div>
        <div className="font-hud" style={{ fontSize: '0.65rem', color: ms.moving ? '#00ff88' : 'rgba(0,212,255,0.3)' }}>
          {ms.moving ? `${Math.round(ms.speed * 100)}%` : 'STOP'}
        </div>
      </div>
    </div>
  )
}
