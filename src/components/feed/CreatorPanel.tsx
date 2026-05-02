import type { FeedVideo } from '../../types/video'
import './CreatorPanel.css'

interface Props {
  video: FeedVideo
  isFollowing: boolean
  onToggleFollow: () => void
}

function CreatorPanel({ video, isFollowing, onToggleFollow }: Props) {
  return (
    <aside className="creator-panel" aria-label="Creator info">
      <div className="creator-panel-inner" key={video.id}>
        <img
          className="creator-avatar"
          src={video.avatar}
          alt={`${video.username} avatar`}
          width={64}
          height={64}
        />
        <div className="creator-username">{video.username}</div>
        <div className="creator-bio">{video.bio}</div>
        <button
          type="button"
          className={`creator-follow${
            isFollowing ? ' creator-follow-active' : ''
          }`}
          onClick={onToggleFollow}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    </aside>
  )
}

export default CreatorPanel
