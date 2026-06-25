import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'

export default function ExerciseWarning() {
  const exerciseSeconds = useGameStore((s) => s.exerciseSeconds)
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const lastShownAt = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // 1시간(3600초)마다 경고
    if (exerciseSeconds > 0 && exerciseSeconds % 3600 === 0 && exerciseSeconds !== lastShownAt.current) {
      lastShownAt.current = exerciseSeconds
      setClosing(false)
      setVisible(true)
      // 15초 후 자동 닫힘
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => dismiss(), 15000)
    }
  }, [exerciseSeconds])

  function dismiss() {
    setClosing(true)
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${closing ? 'fade-out-up' : 'fade-in-down'}`}
      style={{ minWidth: 420 }}
    >
      <div
        className="warn-banner sf-panel px-5 py-3 flex items-center gap-4"
        style={{ border: '1px solid rgba(255,170,0,0.6)', background: 'rgba(20,10,0,0.92)' }}
      >
        {/* 경고 아이콘 */}
        <div className="flex-shrink-0 text-2xl pulse" style={{ color: 'var(--sf-warn)' }}>
          ⚠
        </div>

        {/* 문구 */}
        <div className="flex-1">
          <div className="font-hud text-xs mb-0.5" style={{ color: 'var(--sf-warn)', letterSpacing: '0.08em' }}>
            EXERCISE WARNING
          </div>
          <div className="text-sm" style={{ color: '#ffd680', lineHeight: 1.4 }}>
            운동을 시작한 지 <strong>1시간</strong>이 지났습니다.<br />
            충분한 수분 섭취와 휴식을 취하세요.
          </div>
        </div>

        {/* 닫기 */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 font-hud text-xs px-2 py-1 transition-colors"
          style={{ color: 'rgba(255,170,0,0.7)', border: '1px solid rgba(255,170,0,0.3)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffaa00')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,170,0,0.7)')}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
