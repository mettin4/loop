import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ActionStack from '../components/feed/ActionStack'
import AmbientGlow from '../components/feed/AmbientGlow'
import CreatorPanel from '../components/feed/CreatorPanel'
import VideoCard from '../components/feed/VideoCard'
import { MutedIcon, UnmutedIcon } from '../components/feed/icons'
import ComingSoonToast from '../components/tip/ComingSoonToast'
import TipModal from '../components/tip/TipModal'
import {
  avatarFor,
  dominantColorFromAddress,
  uploadedToFeedVideo,
} from '../lib/feedVideo'
import { shortAddress } from '../lib/formatAddress'
import { SHELBY_CONFIG } from '../lib/shelbyNetwork'
import { copyVideoShareLink, videoShareUrl } from '../lib/shareLink'
import { tipConfigs } from '../lib/tipConfig'
import {
  getShelbyBlobMediaUrl,
  getUploadedVideos,
} from '../lib/videoStorage'
import type { FeedVideo } from '../types/video'
import { useLoopWallet } from '../wallets/useLoopWallet'
import { useWalletModal } from '../wallets/WalletModalContext'
import './Feed.css'

const LIKED_KEY = 'loop:liked-videos'

function loadLikedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(LIKED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

function persistLikedIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    /* quota exceeded, silently drop */
  }
}

function buildFallbackVideo(
  owner: string,
  blobName: string,
): FeedVideo {
  const handle = `@${shortAddress(owner, 4, 4)}`
  return {
    id: `uploaded:${blobName}`,
    username: handle,
    avatar: avatarFor(owner),
    bio: 'Shared from Loop',
    caption: 'Untitled',
    chain: 'APT',
    dominantColor: dominantColorFromAddress(owner),
    duration: 0,
    likes: 0,
    comments: 0,
    tips: 0,
    shares: 0,
    videoUrl: getShelbyBlobMediaUrl(SHELBY_CONFIG.mode, owner, blobName),
    isUploaded: true,
    network: SHELBY_CONFIG.mode,
    ownerAddress: owner,
    blobName,
  }
}

function VideoDetail() {
  const params = useParams<{ owner: string; blobName: string }>()
  const owner = params.owner ? decodeURIComponent(params.owner) : ''
  const blobName = params.blobName ? decodeURIComponent(params.blobName) : ''
  const navigate = useNavigate()

  const video: FeedVideo | null = useMemo(() => {
    if (!owner || !blobName) return null
    const stored = getUploadedVideos().find(
      (v) =>
        v.blobName === blobName &&
        v.ownerAddress.toLowerCase() === owner.toLowerCase(),
    )
    if (stored) return uploadedToFeedVideo(stored)
    return buildFallbackVideo(owner, blobName)
  }, [owner, blobName])

  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState<Set<string>>(() => loadLikedIds())
  const [tipVideo, setTipVideo] = useState<FeedVideo | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const wallet = useLoopWallet()
  const walletModal = useWalletModal()

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      persistLikedIds(next)
      return next
    })
  }

  const handleTip = () => {
    if (!video) return
    const config = tipConfigs[video.chain]
    const ecosystem = config.ecosystem
    if (!wallet[ecosystem].connected) {
      walletModal.open({ preselect: ecosystem })
      return
    }
    setTipVideo(video)
  }

  const handleShare = async () => {
    if (!owner || !blobName) return
    const ok = await copyVideoShareLink(owner, blobName)
    setToastMessage(ok ? 'Link copied' : 'Could not copy link')
  }

  if (!video) {
    const shortOwner = owner ? shortAddress(owner, 6, 4) : ''
    const title = shortOwner
      ? `Video by @${shortOwner} on Loop`
      : 'Video not found · Loop'
    return (
      <div className="feed-page">
        <Helmet>
          <title>{title}</title>
          <meta
            name="description"
            content="Watch on Loop. Videos that no one can take down."
          />
        </Helmet>
        <div className="feed-empty">
          <p className="feed-empty-title">Video not found.</p>
          <p className="feed-empty-body">
            This blob is not visible on Shelby. It may have been deleted, or
            the link is incorrect.
          </p>
          <Link to="/feed" className="btn btn-primary">
            Back to feed
          </Link>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/upload')}
          >
            Upload a video
          </button>
        </div>
      </div>
    )
  }

  const shareUrl = videoShareUrl(owner, blobName)
  const ownerHandle = video.username
  const title = `Video by ${ownerHandle} on Loop`
  const description = 'Watch on Loop. Videos that no one can take down.'
  const videoUrl = video.videoUrl ?? ''

  return (
    <div className="feed-page">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="video.other" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:video" content={videoUrl} />
        <meta property="og:video:secure_url" content={videoUrl} />
        <meta property="og:video:type" content="video/mp4" />
        <meta property="og:video:width" content="1080" />
        <meta property="og:video:height" content="1920" />

        <meta name="twitter:card" content="player" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:player" content={shareUrl} />
        <meta name="twitter:player:width" content="1080" />
        <meta name="twitter:player:height" content="1920" />
        <meta name="twitter:player:stream" content={videoUrl} />
        <meta
          name="twitter:player:stream:content_type"
          content="video/mp4"
        />
      </Helmet>

      <AmbientGlow color={video.dominantColor} />

      <CreatorPanel
        video={video}
        isFollowing={false}
        isSelf={false}
        isPending={false}
        onToggleFollow={() => setToastMessage('Follow coming soon')}
      />

      <button
        type="button"
        className="feed-mute"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <MutedIcon size={20} /> : <UnmutedIcon size={20} />}
      </button>

      <div className="feed-container">
        <VideoCard
          video={video}
          index={0}
          total={1}
          isActive
          isLiked={liked.has(video.id)}
          muted={muted}
          preloadHint="auto"
          onLike={() => toggleLike(video.id)}
        />
      </div>

      <ActionStack
        video={video}
        isLiked={liked.has(video.id)}
        isSelf={false}
        isFollowing={false}
        isPending={false}
        onLike={() => toggleLike(video.id)}
        onComment={() => setToastMessage('Comments coming soon')}
        onTip={handleTip}
        onShare={handleShare}
        onToggleFollow={() => setToastMessage('Follow coming soon')}
      />

      <TipModal
        video={tipVideo}
        isOpen={!!tipVideo}
        onClose={() => setTipVideo(null)}
      />

      {toastMessage && (
        <ComingSoonToast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </div>
  )
}

export default VideoDetail
