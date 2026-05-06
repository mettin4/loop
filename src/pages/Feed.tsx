import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ActionStack from '../components/feed/ActionStack'
import AmbientGlow from '../components/feed/AmbientGlow'
import CreatorPanel from '../components/feed/CreatorPanel'
import VideoCard from '../components/feed/VideoCard'
import { MutedIcon, UnmutedIcon } from '../components/feed/icons'
import TipModal from '../components/tip/TipModal'
import { feedVideos } from '../data/feedVideos'
import { shortAddress } from '../lib/formatAddress'
import { tipConfigs } from '../lib/tipConfig'
import {
  getShelbyBlobMediaUrl,
  getUploadedVideos,
  networkOf,
  type StoredVideo,
} from '../lib/videoStorage'
import type { FeedVideo } from '../types/video'
import { useLoopWallet } from '../wallets/useLoopWallet'
import { useWalletModal } from '../wallets/WalletModalContext'
import './Feed.css'

function avatarFor(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}`
}

function uploadedToFeedVideo(stored: StoredVideo): FeedVideo {
  const handle = `@${shortAddress(stored.uploaderAddress, 4, 4)}`
  const network = networkOf(stored)
  return {
    id: `uploaded:${stored.id}`,
    username: handle,
    avatar: avatarFor(stored.uploaderAddress),
    bio: 'Uploaded to Loop',
    caption: stored.caption || 'Untitled',
    chain: stored.chain,
    dominantColor: '#1a1a1a',
    duration: 0,
    likes: 0,
    comments: 0,
    tips: 0,
    shares: 0,
    videoUrl: getShelbyBlobMediaUrl(network, stored.ownerAddress, stored.blobName),
    isUploaded: true,
    network,
    ownerAddress: stored.ownerAddress,
    blobName: stored.blobName,
    blobExplorerUrl: stored.blobExplorerUrl,
    txHash: stored.txHash,
  }
}

function Feed() {
  const [searchParams] = useSearchParams()
  const requestedVideoId = searchParams.get('v')

  const videos = useMemo<FeedVideo[]>(() => {
    const uploaded = getUploadedVideos().map(uploadedToFeedVideo)
    return [...uploaded, ...feedVideos]
  }, [])

  const initialIndex = (() => {
    if (!requestedVideoId) return 0
    const idx = videos.findIndex((v) => v.id === requestedVideoId)
    return idx >= 0 ? idx : 0
  })()

  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [muted, setMuted] = useState(true)
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [tipVideo, setTipVideo] = useState<FeedVideo | null>(null)
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

  const activeVideo = videos[activeIndex] ?? videos[0]

  const toggleFollow = (username: string) => {
    setFollowing((prev) => {
      const next = new Set(prev)
      if (next.has(username)) next.delete(username)
      else next.add(username)
      return next
    })
  }

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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

  return (
    <div className="feed-page">
      <AmbientGlow color={activeVideo.dominantColor} />

      <CreatorPanel
        video={activeVideo}
        isFollowing={following.has(activeVideo.username)}
        onToggleFollow={() => toggleFollow(activeVideo.username)}
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
        {videos.map((video, i) => (
          <VideoCard
            key={video.id}
            video={video}
            index={i}
            total={videos.length}
            isActive={i === activeIndex}
            isLiked={liked.has(video.id)}
            muted={muted}
            onLike={() => toggleLike(video.id)}
          />
        ))}
      </div>

      <ActionStack
        video={activeVideo}
        isLiked={liked.has(activeVideo.id)}
        onLike={() => toggleLike(activeVideo.id)}
        onComment={() => console.log('comment', activeVideo.id)}
        onTip={handleTip}
        onShare={() => console.log('share', activeVideo.id)}
      />

      <TipModal
        video={tipVideo}
        isOpen={!!tipVideo}
        onClose={() => setTipVideo(null)}
      />
    </div>
  )
}

export default Feed
