import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlayIcon } from '../components/feed/icons'
import { shortAddress } from '../lib/formatAddress'
import {
  getShelbyBlobMediaUrl,
  getUploadedVideos,
  networkOf,
  type StoredVideo,
} from '../lib/videoStorage'
import './Home.css'

interface PreviewItem {
  id: string
  routeId: string
  username: string
  caption: string
  chain: string
  thumbnailUrl?: string
  videoUrl: string
}

function toPreviewItem(stored: StoredVideo): PreviewItem {
  const network = networkOf(stored)
  return {
    id: stored.id,
    routeId: `uploaded:${stored.id}`,
    username: `@${shortAddress(stored.uploaderAddress, 4, 4)}`,
    caption: stored.caption || 'Untitled',
    chain: stored.chain,
    thumbnailUrl: stored.thumbnailUrl,
    videoUrl: getShelbyBlobMediaUrl(
      network,
      stored.ownerAddress,
      stored.blobName,
    ),
  }
}

function PreviewCard({ item }: { item: PreviewItem }) {
  // The video element is always mounted with preload="metadata" so each card
  // shows the paused first frame as its poster. Hover plays the clip.
  const [hovering, setHovering] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleLoadedMetadata = () => {
    const el = videoRef.current
    if (!el) return
    // Nudge off frame 0 so the still is a real image, not a black frame.
    try {
      el.currentTime = 0.1
    } catch {
      /* seeking can fail before metadata fully settles in some browsers */
    }
  }

  const handleEnter = () => {
    setHovering(true)
    const el = videoRef.current
    if (el) el.play().catch(() => {})
  }

  const handleLeave = () => {
    setHovering(false)
    const el = videoRef.current
    if (el) el.pause()
  }

  return (
    <Link
      to={`/feed?v=${encodeURIComponent(item.routeId)}`}
      className="preview-card"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <video
        ref={videoRef}
        className="preview-card-video"
        src={item.videoUrl}
        poster={item.thumbnailUrl}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
      />

      <div className="preview-card-overlay" aria-hidden="true" />

      <span className="preview-live" aria-hidden="true">
        <span className="preview-live-dot" />
        LIVE
      </span>

      {!hovering && (
        <span className="preview-play" aria-hidden="true">
          <PlayIcon size={26} />
        </span>
      )}

      <div className="preview-card-foot">
        <span className="preview-caption">{item.caption}</span>
        <span className="preview-user-row">
          <span className="preview-user">{item.username}</span>
          <span
            className={`preview-chain preview-chain-${item.chain.toLowerCase()}`}
          >
            {item.chain}
          </span>
        </span>
      </div>
    </Link>
  )
}

function Home() {
  const navigate = useNavigate()

  const previewItems = useMemo<PreviewItem[]>(
    () => getUploadedVideos().map(toPreviewItem),
    [],
  )

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-mesh" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-scanlines" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-meta">LOOP / V0.1 / SHELBY</div>
          <h1 className="hero-title">
            Videos that no one
            <br />
            can take down.
          </h1>
          <p className="hero-sub">
            Short videos that no platform can ban, on a network no one can shut down.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/feed')}
            >
              Start watching
            </button>
            <button type="button" className="btn btn-outline">
              Connect wallet
            </button>
          </div>
        </div>
      </section>

      <section className="preview">
        <div className="container">
          <div className="preview-label">
            <span className="preview-label-dot" />
            <span>LIVE NOW</span>
          </div>
        </div>
        {previewItems.length > 0 ? (
          <div className="preview-viewport">
            <div className="preview-track">
              {previewItems.map((v) => (
                <PreviewCard key={v.id} item={v} />
              ))}
            </div>
          </div>
        ) : (
          <div className="container">
            <div className="preview-empty">
              <p className="preview-empty-title">No videos uploaded yet.</p>
              <p className="preview-empty-body">
                Be the first to upload a video to Loop. Drop a clip from your
                phone, sign with your wallet. It lives on Shelby. Nobody can
                take it down.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/upload')}
              >
                Upload a video
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="stats">
        <div className="stats-inner">
          <div className="stat">
            <div className="stat-num">3</div>
            <span className="stat-rule" aria-hidden="true" />
            <div className="stat-label">Chains supported</div>
            <div className="stat-micro">APT, ETH, SOL</div>
          </div>
          <div className="stat">
            <div className="stat-num">&infin;</div>
            <span className="stat-rule" aria-hidden="true" />
            <div className="stat-label">Storage</div>
            <div className="stat-micro">Powered by Shelby</div>
          </div>
          <div className="stat">
            <div className="stat-num">0</div>
            <span className="stat-rule" aria-hidden="true" />
            <div className="stat-label">Censors</div>
            <div className="stat-micro">And never will</div>
          </div>
          <div className="stat">
            <div className="stat-num">100%</div>
            <span className="stat-rule" aria-hidden="true" />
            <div className="stat-label">Yours</div>
            <div className="stat-micro">No platform, no middleman</div>
          </div>
        </div>
      </section>

      <section className="how">
        <div className="container">
          <div className="eyebrow">How it works</div>
          <div className="how-grid">
            <div className="how-col">
              <div className="how-shape" aria-hidden="true">
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 72 72"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="20" y="28" width="32" height="32" />
                  <path d="M36 18 L36 4" />
                  <path d="M28 12 L36 4 L44 12" />
                </svg>
              </div>
              <div className="how-num">01</div>
              <h2 className="how-title">Upload</h2>
              <p className="how-body">
                Record on your phone, sign with your wallet, your video lives
                on Shelby in seconds. No moderation queue.
              </p>
            </div>
            <div className="how-col">
              <div className="how-shape" aria-hidden="true">
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 72 72"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                >
                  <line x1="6" y1="22" x2="58" y2="22" />
                  <line x1="14" y1="38" x2="66" y2="38" />
                  <line x1="2" y1="54" x2="54" y2="54" />
                </svg>
              </div>
              <div className="how-num">02</div>
              <h2 className="how-title">Stream</h2>
              <p className="how-body">
                Open Loop on any device. Videos play instantly. The feed shows
                what people watch, not what an algorithm pushes.
              </p>
            </div>
            <div className="how-col">
              <div className="how-shape" aria-hidden="true">
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 72 72"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                >
                  <circle cx="8" cy="14" r="2.5" fill="currentColor" />
                  <circle cx="8" cy="36" r="2.5" fill="currentColor" />
                  <circle cx="8" cy="58" r="2.5" fill="currentColor" />
                  <line x1="12" y1="14" x2="56" y2="36" />
                  <line x1="12" y1="36" x2="56" y2="36" />
                  <line x1="12" y1="58" x2="56" y2="36" />
                  <circle cx="60" cy="36" r="4" fill="currentColor" />
                </svg>
              </div>
              <div className="how-num">03</div>
              <h2 className="how-title">Earn</h2>
              <p className="how-body">
                Viewers tip you directly. APT, ETH, SOL, all go straight to
                your wallet. No 30 percent cut.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="why" id="why">
        <div className="why-inner">
          <div className="why-pitch">
            <div className="eyebrow">Why Loop?</div>
            <h2 className="why-pitch-title">
              A short video platform
              <br />
              built on Shelby.
            </h2>
            <p className="why-pitch-lede">
              Videos that no one can take down.
            </p>

            <p className="why-text">
              Every platform you have ever loved has banned someone. Every
              video you have ever watched is one takedown away from
              disappearing. Loop is different. Your wallet is your account,
              your chain is your bank, and no one can delete what lives on
              Shelby.
            </p>
            <div className="why-attribution">
              <span className="why-attr-label">- LOOP MANIFESTO</span>
              <span className="why-attr-date">EST. 2026</span>
            </div>

            <div className="why-pitch-grid">
              <article className="why-pitch-block">
                <div className="why-pitch-num">01</div>
                <h3 className="why-pitch-heading">The problem</h3>
                <p className="why-pitch-body">
                  Every platform you use can pull your video. Sometimes for a
                  real reason. Sometimes for nothing. Either way, you don't
                  have a say.
                </p>
              </article>

              <article className="why-pitch-block">
                <div className="why-pitch-num">02</div>
                <h3 className="why-pitch-heading">Where Loop is different</h3>
                <p className="why-pitch-body">
                  Loop doesn't have that lever. Videos live on Shelby, a
                  decentralized storage network from Aptos Labs and Jump
                  Crypto. Once a video is uploaded and registered on chain,
                  no single party can take it down. Not Loop. Not anyone.
                </p>
              </article>

              <article className="why-pitch-block">
                <div className="why-pitch-num">03</div>
                <h3 className="why-pitch-heading">Wallets, not accounts</h3>
                <p className="why-pitch-body">
                  Your wallet is your account. Aptos, Ethereum, or Solana, you
                  pick. Tip a creator and the money goes straight to their
                  wallet. No middleman, no platform fee, no waiting period.
                </p>
              </article>

              <article className="why-pitch-block">
                <div className="why-pitch-num">04</div>
                <h3 className="why-pitch-heading">Built for the long run</h3>
                <p className="why-pitch-body">
                  Creators get paid directly. Viewers don't see ads. The
                  platform doesn't sell your data because it doesn't have any.
                  Loop is the connective tissue between Shelby and the people
                  using it.
                </p>
              </article>
            </div>

            <div className="why-pitch-status">
              <span className="why-pitch-status-label">Status</span>
              <p className="why-pitch-status-body">
                Loop runs on Aptos Testnet today. Wallet sign-in works on
                three chains. Tipping works on three chains. Video upload
                writes to Shelby. Paid reads, video pages, and ETH/SOL upload
                chains are next.
              </p>
            </div>

            <div className="why-pitch-cta">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/feed')}
              >
                Try Loop
              </button>
              <a
                href="https://github.com/mettin4/loop"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="chains">
        <div className="container">
          <div className="eyebrow">Supported chains</div>
          <div className="chains-grid">
            <div className="chain-card">
              <div className="chain-head">
                <div className="chain-status-group">
                  <span className="chain-dot" />
                  <span className="chain-status">Online</span>
                </div>
              </div>
              <div className="chain-name">Aptos</div>
              <div className="chain-tip">Tip in APT</div>
            </div>
            <div className="chain-card">
              <div className="chain-head">
                <div className="chain-status-group">
                  <span className="chain-dot" />
                  <span className="chain-status">Online</span>
                </div>
              </div>
              <div className="chain-name">Ethereum</div>
              <div className="chain-tip">Tip in ETH</div>
            </div>
            <div className="chain-card">
              <div className="chain-head">
                <div className="chain-status-group">
                  <span className="chain-dot" />
                  <span className="chain-status">Online</span>
                </div>
              </div>
              <div className="chain-name">Solana</div>
              <div className="chain-tip">Tip in SOL</div>
            </div>
          </div>
          <p className="chains-note">Connect any compatible wallet.</p>
        </div>
      </section>

      <section className="cta">
        <div className="container cta-inner">
          <div className="cta-eyebrow">Built for creators. Owned by them.</div>
          <h2 className="cta-title">Ready?</h2>
          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={() => navigate('/feed')}
          >
            Start watching
          </button>
          <p className="cta-sub">No signup. No email. Just your wallet.</p>
          <p className="cta-status">Live on Aptos Testnet via Shelby.</p>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-col footer-brand-col">
              <div className="footer-brand">
                <span className="logo-mark" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle
                      cx="11"
                      cy="11"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle cx="11" cy="11" r="3" fill="currentColor" />
                  </svg>
                </span>
                <span className="logo-text">Loop</span>
              </div>
              <p className="footer-tagline">
                Short videos. No platform. No ban.
              </p>
            </div>
            <div className="footer-col">
              <div className="footer-heading">Navigate</div>
              <a href="#" className="footer-link">
                Watch
              </a>
              <a href="#" className="footer-link">
                Upload
              </a>
              <a href="#" className="footer-link">
                Manifesto
              </a>
            </div>
            <div className="footer-col">
              <div className="footer-heading">Social</div>
              <a href="#" className="footer-link">
                GitHub
              </a>
              <a href="#" className="footer-link">
                X
              </a>
              <a href="#" className="footer-link">
                Discord
              </a>
            </div>
          </div>

          <div className="footer-base">
            <div className="footer-base-col">Loop, 2026</div>
            <div className="footer-base-col footer-base-center">
              Built on Shelby Protocol
            </div>
            <div className="footer-base-col footer-base-right">
              <span className="footer-status-dot" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
