import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import ConnectedBadge from './wallet/ConnectedBadge'
import { useLoopWallet } from '../wallets/useLoopWallet'
import { useWalletModal } from '../wallets/WalletModalContext'
import './Navbar.css'

function Navbar() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const wallet = useLoopWallet()
  const walletModal = useWalletModal()

  useEffect(() => {
    if (!isHome) {
      setScrolled(true)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  return (
    <nav className={`navbar ${scrolled ? 'navbar-solid' : 'navbar-ghost'}`}>
      <Link to="/" className="navbar-brand">
        <span className="navbar-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="10" cy="10" r="3.5" fill="currentColor" />
          </svg>
        </span>
        <span className="navbar-logo">Loop</span>
      </Link>

      <div className="navbar-links">
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            `navbar-link${isActive ? ' navbar-link-active' : ''}`
          }
        >
          Feed
        </NavLink>
        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `navbar-link${isActive ? ' navbar-link-active' : ''}`
          }
        >
          Upload
        </NavLink>
        {wallet.isAnyConnected && (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `navbar-link${isActive ? ' navbar-link-active' : ''}`
            }
          >
            Profile
          </NavLink>
        )}
        <a href="/#why" className="navbar-link">
          Why Loop
        </a>
      </div>

      <div className="navbar-wallet">
        {wallet.isAnyConnected ? (
          <>
            <ConnectedBadge wallet={wallet} onClick={() => walletModal.open()} />
            {(wallet.aptos.address ??
              wallet.ethereum.address ??
              wallet.solana.address) && (
              <NotificationBell
                walletAddress={
                  (wallet.aptos.address ??
                    wallet.ethereum.address ??
                    wallet.solana.address) as string
                }
              />
            )}
          </>
        ) : (
          <button
            type="button"
            className="navbar-wallet-btn navbar-wallet-disconnected"
            onClick={() => walletModal.open()}
          >
            Connect wallet
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar
