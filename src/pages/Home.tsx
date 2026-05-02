import { Link, useNavigate } from 'react-router-dom'
import { feedVideos } from '../data/feedVideos'
import './Home.css'

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

function gradientFor(color: string): string {
  return `linear-gradient(160deg, ${color} 0%, #0a0a0a 90%)`
}

function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-mesh" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-scanlines" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-meta">LOOP / V0.1 / SHELBYNET</div>
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
        <div className="watching" aria-hidden="true">
          <span className="watching-dot" />
          <span className="watching-text">247 watching now</span>
        </div>
      </section>

      <section className="preview">
        <div className="container">
          <div className="preview-label">
            <span className="preview-label-dot" />
            <span>LIVE NOW</span>
          </div>
        </div>
        <div className="preview-viewport">
          <div className="preview-track">
            {[...feedVideos, ...feedVideos].map((v, i) => (
              <Link
                key={`${v.id}-${i}`}
                to={`/feed?v=${v.id}`}
                className="preview-card"
                style={{ background: gradientFor(v.dominantColor) }}
              >
                <div className="preview-card-overlay" aria-hidden="true" />
                <span className="preview-views">{formatCount(v.likes)}</span>
                <span
                  className={`preview-chain preview-chain-${v.chain.toLowerCase()}`}
                >
                  {v.chain}
                </span>
                <span className="preview-user">{v.username}</span>
              </Link>
            ))}
          </div>
        </div>
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
          <p className="why-text">
            Every platform you have ever loved has banned someone. Every video
            you have ever watched is one takedown away from disappearing. Loop
            is different. Your wallet is your account, your chain is your bank,
            and no one can delete what lives on Shelby.
          </p>
          <div className="why-attribution">
            <span className="why-attr-label">- LOOP MANIFESTO</span>
            <span className="why-attr-date">EST. 2026</span>
          </div>
        </div>
      </section>

      <section className="chains">
        <div className="container">
          <div className="eyebrow">Supported chains</div>
          <div className="chains-grid">
            <div className="chain-card chain-card-primary">
              <div className="chain-head">
                <div className="chain-status-group">
                  <span className="chain-dot" />
                  <span className="chain-status">Online</span>
                </div>
                <span className="chain-tag chain-tag-primary">Primary</span>
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
                <span className="chain-tag">Mainnet coming</span>
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
                <span className="chain-tag">Integration ready</span>
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
          <div className="cta-social">
            <div className="cta-avatars" aria-hidden="true">
              <span className="cta-avatar cta-avatar-pink">V</span>
              <span className="cta-avatar cta-avatar-green">T</span>
              <span className="cta-avatar cta-avatar-violet">F</span>
            </div>
            <span className="cta-social-text">
              247 creators already on Loop
            </span>
          </div>
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
