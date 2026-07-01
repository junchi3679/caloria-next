import { useGameStore } from '../../store/gameStore'
import type { NoticeItem, NoticeType } from '../../types'

const TYPE_CONFIG: Record<NoticeType, { label: string; color: string; bg: string }> = {
  system: { label: 'SYSTEM',  color: '#00d4ff', bg: 'rgba(0,212,255,0.08)' },
  event:  { label: 'EVENT',   color: '#ffcc00', bg: 'rgba(255,204,0,0.08)' },
  update: { label: 'UPDATE',  color: '#00ff88', bg: 'rgba(0,255,136,0.06)' },
}

function fmtDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function NoticeCard({ notice }: { notice: NoticeItem }) {
  const { readNotice } = useGameStore()
  const cfg = TYPE_CONFIG[notice.type]

  return (
    <div
      className="p-4 flex flex-col gap-2.5"
      style={{
        border: `1px solid ${notice.read ? 'rgba(255,255,255,0.06)' : cfg.color + '40'}`,
        background: notice.read ? 'rgba(0,0,0,0.15)' : cfg.bg,
        cursor: notice.read ? 'default' : 'pointer',
        opacity: notice.read ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
      onClick={() => { if (!notice.read) readNotice(notice.id) }}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!notice.read && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
          )}
          <span className="font-hud text-sm truncate" style={{ color: notice.read ? 'rgba(224,240,255,0.45)' : '#e0f0ff' }}>
            {notice.title}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-hud px-1.5 py-0.5"
            style={{ fontSize: '0.52rem', background: cfg.bg, border: `1px solid ${cfg.color}50`, color: cfg.color }}>
            {cfg.label}
          </span>
          <span className="font-hud" style={{ fontSize: '0.55rem', color: 'rgba(0,212,255,0.35)' }}>
            {fmtDate(notice.createdAt)}
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div className="text-xs leading-relaxed whitespace-pre-line"
        style={{ color: 'rgba(224,240,255,0.6)' }}>
        {notice.body}
      </div>

      {!notice.read && (
        <div className="font-hud text-xs" style={{ color: cfg.color + '66', letterSpacing: '0.08em' }}>
          클릭하여 읽음 처리
        </div>
      )}
    </div>
  )
}

interface Props { onClose: () => void }

export default function Notice({ onClose }: Props) {
  const { notices, readAllNotices } = useGameStore()
  const unreadCount = notices.filter((n) => !n.read).length
  const sorted = [...notices].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,10,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="flex flex-col" style={{ width: 500, maxHeight: '80vh', background: 'var(--sf-bg)', border: '1px solid rgba(0,212,255,0.25)', boxShadow: '0 0 40px rgba(0,212,255,0.08)' }}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.2rem' }}>📢</span>
            <div>
              <div className="font-hud text-lg" style={{ letterSpacing: '0.1em' }}>NOTICE</div>
              <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.45)' }}>
                {unreadCount > 0 ? `미읽음 ${unreadCount}개` : '모두 읽음'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={readAllNotices} className="font-hud text-sm px-4 py-2"
                style={{ border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88', background: 'rgba(0,255,136,0.06)', cursor: 'pointer', letterSpacing: '0.08em' }}>
                모두 읽기
              </button>
            )}
            <button onClick={onClose} className="font-hud text-base px-3 py-1.5"
              style={{ border: '1px solid rgba(0,212,255,0.25)', color: 'rgba(0,212,255,0.6)', cursor: 'pointer', background: 'transparent' }}>
              ✕
            </button>
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4">
          {sorted.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="font-hud text-sm" style={{ color: 'rgba(0,212,255,0.2)' }}>공지가 없습니다</div>
            </div>
          ) : (
            sorted.map((n) => <NoticeCard key={n.id} notice={n} />)
          )}
        </div>
      </div>
    </div>
  )
}
