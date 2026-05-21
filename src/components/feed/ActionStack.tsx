import type { FeedVideo } from '../../types/video'
import { CommentIcon, HeartIcon, ShareIcon } from './icons'
import './ActionStack.css'

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

interface Props {
  video: FeedVideo
  isLiked: boolean
  onLike: () => void
  onComment: () => void
  onTip: () => void
  onShare: () => void
}

function ActionStack({
  video,
  isLiked,
  onLike,
  onComment,
  onTip,
  onShare,
}: Props) {
  return (
    <div className="action-stack">
      <div className="action-item">
        <button
          type="button"
          className={`action-btn${isLiked ? ' action-btn-liked' : ''}`}
          onClick={onLike}
          aria-label={isLiked ? 'Unlike' : 'Like'}
          aria-pressed={isLiked}
        >
          <HeartIcon size={22} filled={isLiked} />
        </button>
        <span className="action-count">{formatCount(video.likes)}</span>
      </div>

      <div className="action-item">
        <button
          type="button"
          className="action-btn"
          onClick={onComment}
          aria-label="Comments"
        >
          <CommentIcon size={22} />
        </button>
        <span className="action-count">{formatCount(video.comments)}</span>
      </div>

      <div className="action-item">
        <button
          type="button"
          className="action-btn action-btn-tip"
          onClick={onTip}
          aria-label="Tip creator"
        >
          Tip
        </button>
        <span className="action-count">{formatCount(video.tips)}</span>
      </div>

      <div className="action-item">
        <button
          type="button"
          className="action-btn"
          onClick={onShare}
          aria-label="Share"
        >
          <ShareIcon size={22} />
        </button>
        <span className="action-count">{formatCount(video.shares)}</span>
      </div>
    </div>
  )
}

export default ActionStack
