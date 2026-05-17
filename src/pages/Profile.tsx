import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AptosIcon,
  EthereumIcon,
  SolanaIcon,
} from '../components/wallet/icons'
import { shortAddress } from '../lib/formatAddress'
import {
  getShelbyBlobMediaUrl,
  getUploadedVideosByOwner,
  networkOf,
  type StoredVideo,
} from '../lib/videoStorage'
import { useLoopWallet } from '../wallets/useLoopWallet'
import './Profile.css'

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function avatarGradientFor(address: string): string {
  if (!address) return 'linear-gradient(135deg, #ff3366, #00ffaa)'
  const h = hashString(address)
  const hue1 = h % 360
  const hue2 = (h * 37 + 120) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 65%, 55%), hsl(${hue2}, 70%, 50%))`
}

interface CopyButtonProps {
  address: string
}

function CopyAddressButton({ address }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('[profile] clipboard write failed:', err)
    }
  }

  return (
    <button
      type="button"
      className="profile-bar-copy"
      onClick={handleCopy}
      aria-label="Copy address"
      title={copied ? 'Copied' : 'Copy address'}
    >
      {copied ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 8 7 12 13 4" />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="5" width="9" height="9" rx="1.5" />
          <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
        </svg>
      )}
    </button>
  )
}

function formatUploadDate(ts: number): string {
  const diffMs = Date.now() - ts
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diffMs < hour) {
    const m = Math.max(1, Math.floor(diffMs / minute))
    return `${m}m ago`
  }
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

interface VideoCardProps {
  video: StoredVideo
}

function ProfileVideoCard({ video }: VideoCardProps) {
  const network = networkOf(video)
  const videoRef = useRef<HTMLVideoElement>(null)
  const seekedRef = useRef(false)
  const src = getShelbyBlobMediaUrl(network, video.ownerAddress, video.blobName)
  const networkLabel = network === 'aptos-testnet' ? 'TESTNET' : 'SHELBYNET'

  const handleEnter = () => {
    const el = videoRef.current
    if (!el) return
    el.play().catch(() => {})
  }
  const handleLeave = () => {
    const el = videoRef.current
    if (!el) return
    el.pause()
    el.currentTime = seekedRef.current ? 1 : 0
  }
  const handleLoadedMetadata = () => {
    const el = videoRef.current
    if (!el) return
    if (el.duration > 1.2 && !seekedRef.current) {
      try {
        el.currentTime = 1
        seekedRef.current = true
      } catch {
        /* some browsers throw if seek before metadata fully ready */
      }
    }
  }

  return (
    <Link
      to={`/feed?v=${encodeURIComponent(`uploaded:${video.id}`)}`}
      className="profile-video-card"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="profile-video-thumb">
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
        />
        <div className="video-badges video-badges-thumb">
          <span className="video-badge video-badge-chain">
            {video.chain || 'APT'}
          </span>
          <span className="video-badge video-badge-network">
            {networkLabel}
          </span>
        </div>
      </div>
      <div className="profile-video-meta">
        <span className="profile-video-caption">
          {video.caption || 'Untitled'}
        </span>
        <span className="profile-video-date">
          {formatUploadDate(video.uploadedAt)}
        </span>
      </div>
    </Link>
  )
}

interface ChainBadgeProps {
  icon: React.ReactNode
  label: string
}

function ChainBadge({ icon, label }: ChainBadgeProps) {
  return (
    <span className="profile-chain-badge">
      <span className="profile-chain-badge-icon">{icon}</span>
      <span className="profile-chain-badge-label">{label}</span>
    </span>
  )
}

function Profile() {
  const navigate = useNavigate()
  const wallet = useLoopWallet()

  useEffect(() => {
    if (!wallet.isAnyConnected) {
      navigate('/feed', { replace: true })
    }
  }, [wallet.isAnyConnected, navigate])

  const aptosAddress = wallet.aptos.address

  const videos = useMemo<StoredVideo[]>(() => {
    if (!aptosAddress) return []
    return getUploadedVideosByOwner(aptosAddress)
  }, [aptosAddress])

  if (!wallet.isAnyConnected) return null

  const primaryAddress =
    wallet.aptos.address ??
    wallet.ethereum.address ??
    wallet.solana.address ??
    ''

  const handleDisconnectAll = () => {
    if (wallet.aptos.connected) wallet.aptos.disconnect()
    if (wallet.ethereum.connected) wallet.ethereum.disconnect()
    if (wallet.solana.connected) wallet.solana.disconnect()
  }

  const videoCountLabel =
    videos.length > 0
      ? `${videos.length} video${videos.length === 1 ? '' : 's'} uploaded`
      : null

  const avatarGradient = avatarGradientFor(primaryAddress)

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <header className="profile-bar">
          <div
            className="profile-bar-avatar"
            aria-hidden="true"
            style={{ background: avatarGradient }}
          />

          <div className="profile-bar-identity">
            <div className="profile-bar-handle-row">
              <span className="profile-bar-handle">
                @{shortAddress(primaryAddress, 6, 4)}
              </span>
              <CopyAddressButton address={primaryAddress} />
            </div>
            {videoCountLabel && (
              <span className="profile-bar-meta">{videoCountLabel}</span>
            )}
          </div>

          <div className="profile-bar-chains">
            {wallet.aptos.connected && (
              <ChainBadge icon={<AptosIcon size={14} />} label="Aptos" />
            )}
            {wallet.ethereum.connected && (
              <ChainBadge icon={<EthereumIcon size={14} />} label="Ethereum" />
            )}
            {wallet.solana.connected && (
              <ChainBadge icon={<SolanaIcon size={14} />} label="Solana" />
            )}
          </div>

          <button
            type="button"
            className="profile-bar-disconnect"
            onClick={handleDisconnectAll}
          >
            Disconnect
          </button>
        </header>

        {!aptosAddress && (
          <div className="profile-videos-empty-block">
            <p className="profile-videos-empty">
              Connect Aptos to see your videos.
            </p>
          </div>
        )}

        {aptosAddress && videos.length === 0 && (
          <div className="profile-videos-empty-block">
            <p className="profile-videos-empty">
              No videos yet. Upload your first one.
            </p>
            <Link to="/upload" className="profile-empty-cta">
              Upload your first video
            </Link>
          </div>
        )}

        {videos.length === 1 && (
          <div className="profile-single-video">
            <ProfileVideoCard video={videos[0]} />
          </div>
        )}

        {videos.length > 1 && (
          <div className="profile-videos-grid">
            {videos.map((v) => (
              <ProfileVideoCard key={v.id} video={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
