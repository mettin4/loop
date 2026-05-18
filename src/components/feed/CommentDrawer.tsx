import { useCallback, useEffect, useRef, useState } from 'react'
import {
  addComment,
  getComments,
  type CommentRecord,
} from '../../lib/api'
import { shortAddress } from '../../lib/formatAddress'
import './CommentDrawer.css'

interface Props {
  isOpen: boolean
  videoId: string | null
  ownerAddress?: string
  userAddress: string | null
  onClose: () => void
  onConnectWallet: () => void
  onCountChange?: (videoId: string, count: number) => void
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

function CommentDrawer({
  isOpen,
  videoId,
  ownerAddress,
  userAddress,
  onClose,
  onConnectWallet,
  onCountChange,
}: Props) {
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen || !videoId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getComments(videoId)
      .then((r) => {
        if (cancelled) return
        setComments(r.comments)
        onCountChange?.(videoId, r.count)
      })
      .catch(() => {
        if (cancelled) return
        setError('Could not load comments')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, videoId, onCountChange])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!videoId || !userAddress) return
      const trimmed = text.trim()
      if (!trimmed) return
      if (trimmed.length > 280) {
        setError('Comment too long (280 char max)')
        return
      }
      setSubmitting(true)
      setError(null)

      const optimistic: CommentRecord = {
        author: userAddress,
        text: trimmed,
        timestamp: Date.now(),
      }
      setComments((prev) => [optimistic, ...prev])
      setText('')
      const newCount = comments.length + 1
      onCountChange?.(videoId, newCount)

      try {
        const { comment } = await addComment(
          videoId,
          userAddress,
          trimmed,
          ownerAddress,
        )
        setComments((prev) => {
          const copy = [...prev]
          const idx = copy.findIndex(
            (c) =>
              c.timestamp === optimistic.timestamp &&
              c.author === optimistic.author &&
              c.text === optimistic.text,
          )
          if (idx >= 0) copy[idx] = comment
          return copy
        })
      } catch {
        setComments((prev) =>
          prev.filter((c) => c !== optimistic && c.timestamp !== optimistic.timestamp),
        )
        onCountChange?.(videoId, Math.max(0, newCount - 1))
        setError('Could not send. Try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [text, videoId, userAddress, ownerAddress, onCountChange, comments.length],
  )

  if (!isOpen) return null

  return (
    <div
      className="comment-drawer-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="comment-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Comments"
      >
        <header className="comment-drawer-header">
          <span className="comment-drawer-title">
            Comments
            {comments.length > 0 && (
              <span className="comment-drawer-count">{comments.length}</span>
            )}
          </span>
          <button
            type="button"
            className="comment-drawer-close"
            onClick={onClose}
            aria-label="Close comments"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="comment-drawer-list">
          {loading && (
            <p className="comment-drawer-status">Loading...</p>
          )}
          {!loading && comments.length === 0 && (
            <p className="comment-drawer-status">
              No comments yet. Be the first.
            </p>
          )}
          {comments.map((c, i) => (
            <article
              key={`${c.timestamp}-${i}`}
              className="comment-item"
            >
              <div className="comment-avatar" aria-hidden="true" />
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">
                    @{shortAddress(c.author, 4, 4)}
                  </span>
                  <span className="comment-time">
                    {relativeTime(c.timestamp)}
                  </span>
                </div>
                <p className="comment-text">{c.text}</p>
              </div>
            </article>
          ))}
        </div>

        {userAddress ? (
          <form className="comment-drawer-input" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              rows={1}
              maxLength={280}
              disabled={submitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e as unknown as React.FormEvent)
                }
              }}
            />
            <button
              type="submit"
              className="comment-send"
              disabled={submitting || !text.trim()}
              aria-label="Send comment"
            >
              {submitting ? '...' : 'Send'}
            </button>
            {error && (
              <p className="comment-drawer-error">{error}</p>
            )}
          </form>
        ) : (
          <div className="comment-drawer-connect">
            <p>Connect wallet to comment</p>
            <button
              type="button"
              className="comment-connect-btn"
              onClick={onConnectWallet}
            >
              Connect wallet
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default CommentDrawer
