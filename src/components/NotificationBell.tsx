import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActivity, type ActivityEventRecord } from '../lib/api'
import { shortAddress } from '../lib/formatAddress'
import './NotificationBell.css'

const LAST_SEEN_KEY = 'loop:last-seen-activity'

function readLastSeen(address: string): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(`${LAST_SEEN_KEY}:${address}`)
    if (!raw) return 0
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function writeLastSeen(address: string, ts: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(`${LAST_SEEN_KEY}:${address}`, String(ts))
  } catch {
    /* quota exceeded, ignore */
  }
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = 60_000
  const hr = 60 * min
  const day = 24 * hr
  if (diff < min) return 'just now'
  if (diff < hr) return `${Math.floor(diff / min)}m ago`
  if (diff < day) return `${Math.floor(diff / hr)}h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

interface Props {
  walletAddress: string
}

function BellIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}

function describeEvent(event: ActivityEventRecord): React.ReactNode {
  const handle = `@${shortAddress(event.from, 4, 4)}`
  if (event.type === 'like') {
    return (
      <>
        <strong>{handle}</strong> liked your video
      </>
    )
  }
  if (event.type === 'comment') {
    return (
      <>
        <strong>{handle}</strong> commented
        {event.text ? <>: &ldquo;{event.text.slice(0, 60)}{event.text.length > 60 ? '...' : ''}&rdquo;</> : null}
      </>
    )
  }
  if (event.type === 'follow') {
    return (
      <>
        <strong>{handle}</strong> started following you
      </>
    )
  }
  return (
    <>
      <strong>{handle}</strong> tipped you{' '}
      {event.amount ?? 0} {event.chain ?? ''}
    </>
  )
}

function eventLink(event: ActivityEventRecord): string | null {
  if (event.videoId) {
    return `/feed?v=${encodeURIComponent(event.videoId)}`
  }
  if (event.type === 'follow') {
    return '/profile'
  }
  return null
}

function NotificationBell({ walletAddress }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState<ActivityEventRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [lastSeen, setLastSeen] = useState<number>(() =>
    readLastSeen(walletAddress),
  )
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLastSeen(readLastSeen(walletAddress))
  }, [walletAddress])

  const fetchEvents = useCallback(() => {
    if (!walletAddress) return
    setLoading(true)
    getActivity(walletAddress)
      .then((r) => setEvents(r.events.slice(0, 20)))
      .catch(() => {
        /* leave previous events */
      })
      .finally(() => setLoading(false))
  }, [walletAddress])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const root = containerRef.current
      if (!root) return
      if (!root.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const id = window.setInterval(fetchEvents, 30_000)
    return () => window.clearInterval(id)
  }, [open, fetchEvents])

  const unreadCount = useMemo(
    () => events.filter((e) => e.timestamp > lastSeen).length,
    [events, lastSeen],
  )

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        fetchEvents()
        const now = Date.now()
        writeLastSeen(walletAddress, now)
        setLastSeen(now)
      }
      return next
    })
  }

  const handleEventClick = (event: ActivityEventRecord) => {
    const to = eventLink(event)
    if (to) {
      navigate(to)
    }
    setOpen(false)
  }

  return (
    <div className="notif-bell" ref={containerRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={handleToggle}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={open}
      >
        <BellIcon size={18} />
        {unreadCount > 0 && (
          <span className="notif-bell-badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" role="dialog" aria-label="Notifications">
          <header className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications</span>
            <button
              type="button"
              className="notif-dropdown-refresh"
              onClick={fetchEvents}
              aria-label="Refresh"
              disabled={loading}
            >
              {loading ? '...' : 'Refresh'}
            </button>
          </header>

          <div className="notif-dropdown-list">
            {!loading && events.length === 0 && (
              <p className="notif-dropdown-empty">No notifications yet</p>
            )}
            {events.length > 0 &&
              events.map((event, i) => {
                const isUnread = event.timestamp > lastSeen
                const clickable = !!eventLink(event)
                return (
                  <button
                    key={`${event.timestamp}-${i}`}
                    type="button"
                    className={`notif-item${isUnread ? ' notif-item-unread' : ''}${
                      clickable ? '' : ' notif-item-static'
                    }`}
                    onClick={() => handleEventClick(event)}
                    disabled={!clickable}
                  >
                    <span
                      className={`notif-dot notif-dot-${event.type}`}
                      aria-hidden="true"
                    />
                    <span className="notif-body">
                      <span className="notif-text">{describeEvent(event)}</span>
                      <span className="notif-time">
                        {relativeTime(event.timestamp)}
                      </span>
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
