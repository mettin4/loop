import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ActionStack from '../components/feed/ActionStack'
import AmbientGlow from '../components/feed/AmbientGlow'
import CreatorPanel from '../components/feed/CreatorPanel'
import VideoCard from '../components/feed/VideoCard'
import { MutedIcon, UnmutedIcon } from '../components/feed/icons'
import ComingSoonToast from '../components/tip/ComingSoonToast'
import TipModal from '../components/tip/TipModal'
import { uploadedToFeedVideo } from '../lib/feedVideo'
import { copyVideoShareLink } from '../lib/shareLink'
import { tipConfigs } from '../lib/tipConfig'
import { getUploadedVideos } from '../lib/videoStorage'
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

function Feed() {
  const [searchParams] = useSearchParams()
  const requestedVideoId = searchParams.get('v')

  const videos = useMemo<FeedVideo[]>(
    () => getUploadedVideos().map(uploadedToFeedVideo),
    [],
  )

  const initialIndex = (() => {
    if (!requestedVideoId) return 0
    const idx = videos.findIndex((v) => v.id === requestedVideoId)
    return idx >= 0 ? idx : 0
  })()

  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState<Set<string>>(() => loadLikedIds())
  const [tipVideo, setTipVideo] = useState<FeedVideo | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const wallet = useLoopWallet()
  const walletModal = useWalletModal()

  useEffect(() => {
    if (!requestedVideoId) return
    const root = containerRef.current
    if (!root) return
    const target = root.querySelector<HTMLElement>(
      `[data-video-id="${requestedVideoId}"]`,
    )
    if (target) {
      target.scrollIntoView({
        behavior: 'instant' as ScrollBehavior,
        block: 'start',
      })
    }
  }, [requestedVideoId])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const cards = Array.from(
      root.querySelectorAll<HTMLElement>('[data-index]'),
    )
    if (cards.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.index,
            )
            if (!Number.isNaN(idx)) setActiveIndex(idx)
          }
        }
      },
      { root, threshold: 0.7 },
    )

    cards.forEach((c) => observer.observe(c))
    return () => observer.disconnect()
  }, [videos.length])

  const activeVideo: FeedVideo | undefined = videos[activeIndex] ?? videos[0]

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
    const video = activeVideo
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
    const video = activeVideo
    if (!video || !video.ownerAddress || !video.blobName) return
    const ok = await copyVideoShareLink(video.ownerAddress, video.blobName)
    setToastMessage(ok ? 'Link copied' : 'Could not copy link')
  }

  if (!activeVideo) {
    return (
      <div className="feed-page">
        <div className="feed-empty">
          <p className="feed-empty-title">No videos yet.</p>
          <p className="feed-empty-body">Be the first to upload.</p>
          <Link to="/upload" className="btn btn-primary">
            Upload a video
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="feed-page">
      <AmbientGlow color={activeVideo.dominantColor} />

      <CreatorPanel
        video={activeVideo}
        isFollowing={false}
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

      <div className="feed-container" ref={containerRef}>
        {videos.map((video, i) => {
          const distance = Math.abs(i - activeIndex)
          const preloadHint: 'auto' | 'metadata' | 'none' =
            distance === 0 ? 'auto' : distance === 1 ? 'metadata' : 'none'
          return (
            <VideoCard
              key={video.id}
              video={video}
              index={i}
              total={videos.length}
              isActive={i === activeIndex}
              isLiked={liked.has(video.id)}
              muted={muted}
              preloadHint={preloadHint}
              onLike={() => toggleLike(video.id)}
            />
          )
        })}
      </div>

      <ActionStack
        video={activeVideo}
        isLiked={liked.has(activeVideo.id)}
        onLike={() => toggleLike(activeVideo.id)}
        onComment={() => setToastMessage('Comments coming soon')}
        onTip={handleTip}
        onShare={handleShare}
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

export default Feed
