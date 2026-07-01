import { useGameStore } from '../../store/gameStore'
import type { MailItem, MailReward } from '../../types'

const REWARD_LABEL: Record<string, string> = {
  crystals: '◈ 크리스탈',
  limitedCrystals: '★ 별조각',
  gold: '🪙 골드',
  shards: '🔷 파편',
  standardTicket: '🎫 상시 뽑기권',
  limitedTicket: '🎟 한정 뽑기권',
  expItem: '🧪 성장 아이템',
  weapon: '⚔️ 무기',
  accessory: '💍 잡템',
}

function RewardChip({ reward }: { reward: MailReward }) {
  const label = REWARD_LABEL[reward.type] ?? reward.type
  const amount = reward.amount != null ? reward.amount : (reward.item as { name?: string })?.name ?? ''
  return (
    <span className="font-hud inline-flex items-center gap-1 px-2 py-0.5"
      style={{ border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.06)', fontSize: '0.6rem', color: 'rgba(224,240,255,0.7)' }}>
      {label}{amount ? ` +${amount}` : ''}
    </span>
  )
}

function MailCard({ mail }: { mail: MailItem }) {
  const { claimMail } = useGameStore()
  const expired = mail.expiresAt != null && Date.now() > mail.expiresAt
  const now = Date.now()
  const remaining = mail.expiresAt ? Math.max(0, Math.ceil((mail.expiresAt - now) / (1000 * 60 * 60 * 24))) : null

  return (
    <div className="p-4 flex flex-col gap-2.5" style={{
      border: `1px solid ${mail.claimed ? 'rgba(255,255,255,0.06)' : expired ? 'rgba(255,100,100,0.2)' : 'rgba(0,212,255,0.2)'}`,
      background: mail.claimed ? 'rgba(0,0,0,0.2)' : 'rgba(0,10,30,0.6)',
      opacity: mail.claimed ? 0.5 : 1,
    }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-hud text-sm truncate" style={{ color: mail.claimed ? 'rgba(224,240,255,0.4)' : '#e0f0ff' }}>
            {mail.title}
          </div>
          <div className="font-hud text-xs mt-0.5" style={{ color: 'rgba(0,212,255,0.4)' }}>
            {mail.from}
          </div>
        </div>
        {remaining != null && !mail.claimed && (
          <div className="font-hud flex-shrink-0 text-xs px-2 py-0.5"
            style={{ border: `1px solid ${remaining <= 1 ? 'rgba(255,80,80,0.5)' : 'rgba(255,180,0,0.3)'}`, color: remaining <= 1 ? '#ff6644' : 'rgba(255,180,0,0.7)', fontSize: '0.55rem' }}>
            {remaining}일 남음
          </div>
        )}
        {expired && !mail.claimed && (
          <div className="font-hud flex-shrink-0 text-xs px-2 py-0.5" style={{ border: '1px solid rgba(255,80,80,0.3)', color: '#ff6644', fontSize: '0.55rem' }}>
            만료
          </div>
        )}
      </div>

      <div className="text-xs leading-relaxed" style={{ color: 'rgba(224,240,255,0.55)', whiteSpace: 'pre-line' }}>
        {mail.body}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {mail.rewards.map((r, i) => <RewardChip key={i} reward={r} />)}
      </div>

      {!mail.claimed && !expired && (
        <button onClick={() => claimMail(mail.id)} className="font-hud text-sm py-2.5 w-full"
          style={{ border: '1px solid rgba(0,212,255,0.5)', color: '#00d4ff', background: 'rgba(0,212,255,0.08)', cursor: 'pointer', letterSpacing: '0.1em' }}>
          수령하기
        </button>
      )}
      {mail.claimed && (
        <div className="font-hud text-xs text-center py-1.5" style={{ color: 'rgba(0,212,255,0.25)', letterSpacing: '0.1em' }}>
          수령 완료
        </div>
      )}
    </div>
  )
}

interface MailboxProps {
  onClose: () => void
}

export default function Mailbox({ onClose }: MailboxProps) {
  const { mailbox, claimAllMail } = useGameStore()
  const unclaimedCount = mailbox.filter((m) => !m.claimed && !(m.expiresAt && Date.now() > m.expiresAt)).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,10,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="flex flex-col" style={{ width: 480, maxHeight: '80vh', background: 'var(--sf-bg)', border: '1px solid rgba(0,212,255,0.25)', boxShadow: '0 0 40px rgba(0,212,255,0.08)' }}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.2rem' }}>📬</span>
            <div>
              <div className="font-hud text-lg" style={{ letterSpacing: '0.1em' }}>MAILBOX</div>
              <div className="font-hud text-xs" style={{ color: 'rgba(0,212,255,0.45)' }}>
                {unclaimedCount > 0 ? `미수령 ${unclaimedCount}개` : '모두 수령 완료'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unclaimedCount > 0 && (
              <button onClick={claimAllMail} className="font-hud text-sm px-4 py-2"
                style={{ border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88', background: 'rgba(0,255,136,0.06)', cursor: 'pointer', letterSpacing: '0.08em' }}>
                모두 받기
              </button>
            )}
            <button onClick={onClose} className="font-hud text-base px-3 py-1.5"
              style={{ border: '1px solid rgba(0,212,255,0.25)', color: 'rgba(0,212,255,0.6)', cursor: 'pointer', background: 'transparent' }}>
              ✕
            </button>
          </div>
        </div>

        {/* 메일 목록 */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4">
          {mailbox.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="font-hud text-sm text-center" style={{ color: 'rgba(0,212,255,0.2)' }}>
                받은 우편이 없습니다
              </div>
            </div>
          )}
          {[...mailbox].reverse().map((mail) => (
            <MailCard key={mail.id} mail={mail} />
          ))}
        </div>
      </div>
    </div>
  )
}
