import { useEffect, useRef, useState } from 'react'
import type { FeedVideo } from '../../types/video'
import LikeBurst from './LikeBurst'
import { MutedIcon, PlayIcon } from './icons'
import './VideoCard.css'

interface Props {
  video: FeedVideo
  index: number
  total: number
  isActive: boolean
  isLiked: boolean
  muted: boolean
  preloadHint: 'auto' | 'metadata' | 'none'
  onLike: () => void
  onUnmute: () => void
}

function VideoCard({
  video,
  index,
  total,
  isActive,
  isLiked,
  muted,
  preloadHint,
  onLike,
  onUnmute,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [burstKey, setBurstKey] = useState(0)
  const [loadFailed, setLoadFailed] = useState(false)
  const [isBuffered, setIsBuffered] = useState(false)
  const [captionExpanded, setCaptionExpanded] = useState(false)
  const [captionOverflows, setCaptionOverflows] = useState(false)
  const tapTimeoutRef = useRef<number | null>(null)
  const lastTapRef = useRef(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const captionRef = useRef<HTMLParagraphElement>(null)
  const hasRealVideo = !!video.videoUrl

  useEffect(() => {
    setIsBuffered(false)
    setLoadFailed(false)
  }, [video.videoUrl])

  useEffect(() => {
    setCaptionExpanded(false)
  }, [video.id])

  useEffect(() => {
    if (captionExpanded) return
    const el = captionRef.current
    if (!el) {
      setCaptionOverflows(false)
      return
    }
    setCaptionOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [video.caption, video.id, captionExpanded])

  // React's muted attribute does not always sync to the DOM property,
  // so set it imperatively to guarantee sound toggles take effect.
  useEffect(() => {
    const el = videoRef.current
    if (el) el.muted = muted
  }, [muted, hasRealVideo, video.videoUrl])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !hasRealVideo) return

    if (!isActive || !isPlaying) {
      el.pause()
      if (!isActive) el.currentTime = 0
      return
    }

    const tryPlay = () => {
      el.play().catch(() => {
        /* autoplay can fail; user tap will retry */
      })
    }

    if (el.readyState >= 3) {
      tryPlay()
      return
    }

    el.addEventListener('canplay', tryPlay, { once: true })
    return () => el.removeEventListener('canplay', tryPlay)
  }, [isActive, isPlaying, hasRealVideo, video.videoUrl])

  useEffect(() => {
    if (hasRealVideo) return
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
  }, [isActive, isPlaying, video.duration, hasRealVideo])

  const handleTimeUpdate = () => {
    const el = videoRef.current
    if (!el || !el.duration || Number.isNaN(el.duration)) return
    setProgress(el.currentTime / el.duration)
  }

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
      <div
        className="video-container"
        style={
          hasRealVideo
            ? undefined
            : { background: video.dominantColor }
        }
      >
        {hasRealVideo && (
          <video
            ref={videoRef}
            className="video-element"
            src={video.videoUrl}
            muted={muted}
            loop
            playsInline
            preload={preloadHint}
            onTimeUpdate={handleTimeUpdate}
            onCanPlay={() => setIsBuffered(true)}
            onError={() => setLoadFailed(true)}
          />
        )}

        {hasRealVideo && isActive && !isBuffered && !loadFailed && (
          <div className="video-loading" aria-hidden="true">
            <span className="video-loading-spinner" />
          </div>
        )}

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

        {hasRealVideo && isActive && muted && !loadFailed && (
          <button
            type="button"
            className="video-unmute-hint"
            onClick={(e) => {
              e.stopPropagation()
              onUnmute()
            }}
            aria-label="Tap to unmute"
          >
            <span className="video-unmute-hint-icon">
              <MutedIcon size={18} />
            </span>
            <span className="video-unmute-hint-text">Tap to unmute</span>
          </button>
        )}

        {hasRealVideo && loadFailed && (
          <div className="video-load-error" aria-live="polite">
            <span>Video failed to load. See console.</span>
          </div>
        )}

        <LikeBurst trigger={burstKey} />

        <div className="video-overlay-top">
          <span className="video-counter">
            {index + 1} / {total}
          </span>
        </div>

        <div className="video-overlay-bottom">
          <div className="video-meta">
            <span className="video-meta-user">{video.username}</span>
            {video.caption && (
              <p
                ref={captionRef}
                className={`video-meta-caption${
                  captionExpanded ? ' video-meta-caption-expanded' : ''
                }`}
              >
                {video.caption}
              </p>
            )}
            {(captionOverflows || captionExpanded) && (
              <button
                type="button"
                className="video-meta-more"
                onClick={(e) => {
                  e.stopPropagation()
                  setCaptionExpanded((v) => !v)
                }}
              >
                {captionExpanded ? 'less' : '...more'}
              </button>
            )}
            {video.tags && video.tags.length > 0 && (
              <div className="video-meta-tags">
                {video.tags.map((tag) => (
                  <span key={tag} className="video-meta-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
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
