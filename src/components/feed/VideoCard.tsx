import { useEffect, useRef, useState } from 'react'
import type { FeedVideo } from '../../types/video'
import LikeBurst from './LikeBurst'
import { PlayIcon } from './icons'
import './VideoCard.css'

interface Props {
  video: FeedVideo
  index: number
  total: number
  isActive: boolean
  isLiked: boolean
  muted: boolean
  onLike: () => void
}

function VideoCard({
  video,
  index,
  total,
  isActive,
  isLiked,
  muted,
  onLike,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [burstKey, setBurstKey] = useState(0)
  const tapTimeoutRef = useRef<number | null>(null)
  const lastTapRef = useRef(0)

  useEffect(() => {
    if (!isActive) {
      setProgress(0)
      return
    }
    if (!isPlaying) return
    const tick = 100
    const interval = window.setInterval(() => {
      setProgress((p) => {
        const next = p + tick / 1000 / video.duration
        return next >= 1 ? 0 : next
      })
    }, tick)
    return () => window.clearInterval(interval)
  }, [isActive, isPlaying, video.duration])

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current)
    }
  }, [])

  const handleTap = () => {
    const now = Date.now()
    const dt = now - lastTapRef.current
    if (dt < 300) {
      if (tapTimeoutRef.current) {
        window.clearTimeout(tapTimeoutRef.current)
        tapTimeoutRef.current = null
      }
      if (!isLiked) onLike()
      setBurstKey((k) => k + 1)
      lastTapRef.current = 0
      return
    }
    lastTapRef.current = now
    tapTimeoutRef.current = window.setTimeout(() => {
      setIsPlaying((p) => !p)
      tapTimeoutRef.current = null
    }, 280)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    setProgress(Math.max(0, Math.min(1, ratio)))
  }

  return (
    <div
      className="video-card"
      data-index={index}
      data-video-id={video.id}
    >
      <div className="video-container">
        <video
          className="video-element"
          src=""
          muted={muted}
          loop
          playsInline
          autoPlay={isActive && isPlaying}
          poster=""
        />

        <button
          type="button"
          className="video-tap-target"
          onClick={handleTap}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        />

        {!isPlaying && (
          <div className="video-paused" aria-hidden="true">
            <PlayIcon size={48} />
          </div>
        )}

        <LikeBurst trigger={burstKey} />

        <div className="video-overlay-top">
          <span
            className={`video-chain video-chain-${video.chain.toLowerCase()}`}
          >
            {video.chain}
          </span>
          <span className="video-counter">
            {index + 1} / {total}
          </span>
        </div>

        <div
          className="video-progress"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className="video-progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default VideoCard
