import { useGameStore } from '../../store/gameStore'

export default function TitleScreen() {
  const setScreen = useGameStore((s) => s.setScreen)

  return (
    <div className="fixed inset-0 scanline flex flex-col items-center justify-center" style={{ background: 'var(--sf-bg)' }}>
      {/* 배경 그리드 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* 중앙 컨텐츠 */}
      <div className="relative z-10 text-center">
        {/* 부제 */}
        <div
          className="font-hud text-xs mb-6 tracking-widest pulse"
          style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.4em' }}
        >
          ── GALAXY RESTORATION PROJECT ──
        </div>

        {/* 타이틀 */}
        <h1 className="font-hud text-glow mb-2" style={{ fontSize: '3.5rem', letterSpacing: '0.05em', lineHeight: 1 }}>
          CALORIA
        </h1>
        <div className="font-hud text-glow-accent mb-1" style={{ fontSize: '1.1rem', letterSpacing: '0.3em' }}>
          NEXT GENERATION
        </div>
        <div className="mb-10" style={{ color: 'rgba(0,212,255,0.3)', fontSize: '0.7rem', letterSpacing: '0.2em' }}>
          칼로리아: 넥스트 제네레이션  v1.0
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-4 mb-10 justify-center">
          <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4))' }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--sf-primary)' }} />
          <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.4), transparent)' }} />
        </div>

        {/* 세계관 설명 */}
        <div
          className="sf-panel mb-10 px-8 py-4 text-sm leading-relaxed max-w-md mx-auto holo-flicker"
          style={{ color: 'rgba(224,240,255,0.6)', textAlign: 'left' }}
        >
          <span style={{ color: 'rgba(0,212,255,0.8)' }}>서기 3100년.</span> 기계 문명의 부작용으로<br />
          은하계 행성들이 기후 동결 현상에 빠져들고 있다.<br />
          오직 <span style={{ color: 'var(--sf-accent)' }}>운동</span>으로 행성의 생명력을 되살려라.
        </div>

        {/* 시작 버튼 */}
        <button
          className="sf-btn-accent px-12 py-4"
          style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.8rem', letterSpacing: '0.2em' }}
          onClick={() => setScreen('character_select')}
        >
          LAUNCH MISSION
        </button>

        <div className="mt-4 font-hud text-xs pulse" style={{ color: 'rgba(0,212,255,0.3)', letterSpacing: '0.15em' }}>
          PRESS TO BEGIN
        </div>
      </div>

      {/* 하단 버전 정보 */}
      <div
        className="absolute bottom-4 right-6 font-hud text-xs"
        style={{ color: 'rgba(0,212,255,0.25)', letterSpacing: '0.1em' }}
      >
        BUILD 1.0.0 · 3100 A.D.
      </div>
    </div>
  )
}
