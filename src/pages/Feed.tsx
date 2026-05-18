import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ActionStack from '../components/feed/ActionStack'
import AmbientGlow from '../components/feed/AmbientGlow'
import CommentDrawer from '../components/feed/CommentDrawer'
import CreatorPanel from '../components/feed/CreatorPanel'
import VideoCard from '../components/feed/VideoCard'
import { MutedIcon, UnmutedIcon } from '../components/feed/icons'
import ComingSoonToast from '../components/tip/ComingSoonToast'
import TipModal from '../components/tip/TipModal'
import {
  getComments,
  getFollow,
  getLikes,
  toggleFollow,
  toggleLike,
} from '../lib/api'
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
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [followState, setFollowState] = useState<
    Record<string, { isFollowing: boolean; count: number }>
  >({})
  const [followPending, setFollowPending] = useState<Set<string>>(new Set())
  const [tipVideo, setTipVideo] = useState<FeedVideo | null>(null)
  const [commentVideo, setCommentVideo] = useState<FeedVideo | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fetchedLikes = useRef<Set<string>>(new Set())
  const fetchedComments = useRef<Set<string>>(new Set())
  const fetchedFollow = useRef<Set<string>>(new Set())

  const wallet = useLoopWallet()
  const walletModal = useWalletModal()

  const userAddress =
    wallet.aptos.address ??
    wallet.ethereum.address ??
    wallet.solana.address ??
    null

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

  useEffect(() => {
    const video = activeVideo
    if (!video) return
    if (fetchedLikes.current.has(video.id)) {
      if (userAddress) {
        getLikes(video.id, userAddress)
          .then((r) => {
            setLikeCounts((p) => ({ ...p, [video.id]: r.count }))
            setLiked((prev) => {
              const next = new Set(prev)
              if (r.isLiked) next.add(video.id)
              else next.delete(video.id)
              persistLikedIds(next)
              return next
            })
          })
          .catch(() => {})
      }
      return
    }
    fetchedLikes.current.add(video.id)
    getLikes(video.id, userAddress ?? undefined)
      .then((r) => {
        setLikeCounts((p) => ({ ...p, [video.id]: r.count }))
        if (userAddress) {
          setLiked((prev) => {
            const next = new Set(prev)
            if (r.isLiked) next.add(video.id)
            else next.delete(video.id)
            persistLikedIds(next)
            return next
          })
        }
      })
      .catch(() => {})
  }, [activeVideo, userAddress])

  useEffect(() => {
    const video = activeVideo
    if (!video) return
    if (fetchedComments.current.has(video.id)) return
    fetchedComments.current.add(video.id)
    getComments(video.id)
      .then((r) => {
        setCommentCounts((p) => ({ ...p, [video.id]: r.count }))
      })
      .catch(() => {})
  }, [activeVideo])

  useEffect(() => {
    const video = activeVideo
    if (!video || !video.ownerAddress) return
    const cacheKey = `${video.ownerAddress}::${userAddress ?? ''}`
    if (fetchedFollow.current.has(cacheKey)) return
    fetchedFollow.current.add(cacheKey)
    getFollow(video.ownerAddress, userAddress ?? undefined)
      .then((r) => {
        setFollowState((p) => ({
          ...p,
          [video.ownerAddress as string]: {
            isFollowing: r.isFollowing,
            count: r.count,
          },
        }))
      })
      .catch(() => {})
  }, [activeVideo, userAddress])

  const handleToggleLike = useCallback(
    (video: FeedVideo) => {
      if (!userAddress) {
        walletModal.open()
        return
      }
      const id = video.id
      const wasLiked = liked.has(id)
      const prevCount = likeCounts[id] ?? 0

      setLiked((prev) => {
        const next = new Set(prev)
        if (wasLiked) next.delete(id)
        else next.add(id)
        persistLikedIds(next)
        return next
      })
      setLikeCounts((p) => ({
        ...p,
        [id]: Math.max(0, prevCount + (wasLiked ? -1 : 1)),
      }))

      toggleLike(id, userAddress, video.ownerAddress, video.caption)
        .then((r) => {
          setLikeCounts((p) => ({ ...p, [id]: r.count }))
          setLiked((prev) => {
            const next = new Set(prev)
            if (r.isLiked) next.add(id)
            else next.delete(id)
            persistLikedIds(next)
            return next
          })
        })
        .catch(() => {
          setLiked((prev) => {
            const next = new Set(prev)
            if (wasLiked) next.add(id)
            else next.delete(id)
            persistLikedIds(next)
            return next
          })
          setLikeCounts((p) => ({ ...p, [id]: prevCount }))
          setToastMessage("Couldn't sync like")
        })
    },
    [userAddress, walletModal, liked, likeCounts],
  )

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

  const handleOpenComments = () => {
    const video = activeVideo
    if (!video) return
    setCommentVideo(video)
  }

  const handleToggleFollow = () => {
    const video = activeVideo
    if (!video || !video.ownerAddress) return
    if (!userAddress) {
      walletModal.open()
      return
    }
    const target = video.ownerAddress
    if (target.toLowerCase() === userAddress.toLowerCase()) return
    if (followPending.has(target)) return

    const current = followState[target] ?? { isFollowing: false, count: 0 }
    const optimistic = {
      isFollowing: !current.isFollowing,
      count: Math.max(0, current.count + (current.isFollowing ? -1 : 1)),
    }
    setFollowState((p) => ({ ...p, [target]: optimistic }))
    setFollowPending((p) => new Set(p).add(target))

    toggleFollow(target, userAddress)
      .then((r) => {
        setFollowState((p) => ({
          ...p,
          [target]: { isFollowing: r.isFollowing, count: r.count },
        }))
      })
      .catch(() => {
        setFollowState((p) => ({ ...p, [target]: current }))
        setToastMessage("Couldn't sync follow")
      })
      .finally(() => {
        setFollowPending((p) => {
          const next = new Set(p)
          next.delete(target)
          return next
        })
      })
  }

  const handleCommentCountChange = useCallback(
    (videoId: string, count: number) => {
      setCommentCounts((p) => ({ ...p, [videoId]: count }))
    },
    [],
  )

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

  const activeOwner = activeVideo.ownerAddress ?? ''
  const activeFollow = activeOwner ? followState[activeOwner] : undefined
  const isSelfActive =
    !!userAddress &&
    !!activeOwner &&
    userAddress.toLowerCase() === activeOwner.toLowerCase()

  const activeVideoForDisplay: FeedVideo = {
    ...activeVideo,
    likes: likeCounts[activeVideo.id] ?? activeVideo.likes,
    comments: commentCounts[activeVideo.id] ?? activeVideo.comments,
  }

  return (
    <div className="feed-page">
      <AmbientGlow color={activeVideo.dominantColor} />

      <CreatorPanel
        video={activeVideo}
        isFollowing={!!activeFollow?.isFollowing}
        isSelf={isSelfActive}
        isPending={!!activeOwner && followPending.has(activeOwner)}
        onToggleFollow={handleToggleFollow}
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
              onLike={() => handleToggleLike(video)}
            />
          )
        })}
      </div>

      <ActionStack
        video={activeVideoForDisplay}
        isLiked={liked.has(activeVideo.id)}
        onLike={() => handleToggleLike(activeVideo)}
        onComment={handleOpenComments}
        onTip={handleTip}
        onShare={handleShare}
      />

      <TipModal
        video={tipVideo}
        isOpen={!!tipVideo}
        onClose={() => setTipVideo(null)}
      />

      <CommentDrawer
        isOpen={!!commentVideo}
        videoId={commentVideo?.id ?? null}
        ownerAddress={commentVideo?.ownerAddress}
        userAddress={userAddress}
        onClose={() => setCommentVideo(null)}
        onConnectWallet={() => {
          setCommentVideo(null)
          walletModal.open()
        }}
        onCountChange={handleCommentCountChange}
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
