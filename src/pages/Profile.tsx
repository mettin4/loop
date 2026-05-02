import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AptosIcon,
  EthereumIcon,
  SolanaIcon,
} from '../components/wallet/icons'
import { shortAddress } from '../lib/formatAddress'
import { useLoopWallet } from '../wallets/useLoopWallet'
import './Profile.css'

interface RowProps {
  icon: ReactNode
  name: string
  address: string | null
}

function ProfileRow({ icon, name, address }: RowProps) {
  return (
    <div className="profile-row">
      <span className="profile-row-icon">{icon}</span>
      <div className="profile-row-text">
        <span className="profile-row-name">{name}</span>
        <span className="profile-row-addr">
          {address ? shortAddress(address) : ''}
        </span>
      </div>
      <div className="profile-row-status">
        <span className="profile-row-dot" aria-hidden="true" />
        <span className="profile-row-status-label">Connected</span>
      </div>
    </div>
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

  if (!wallet.isAnyConnected) return null

  const primaryAddress =
    wallet.aptos.address ??
    wallet.ethereum.address ??
    wallet.solana.address ??
    ''

  const chainsLabel =
    wallet.connectedCount === 1
      ? '1 chain connected'
      : `${wallet.connectedCount} chains connected`

  const handleDisconnectAll = () => {
    if (wallet.aptos.connected) wallet.aptos.disconnect()
    if (wallet.ethereum.connected) wallet.ethereum.disconnect()
    if (wallet.solana.connected) wallet.solana.disconnect()
  }

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-avatar" aria-hidden="true" />
        <h1 className="profile-address">{shortAddress(primaryAddress)}</h1>
        <p className="profile-subtitle">{chainsLabel}</p>

        <div className="profile-rows">
          {wallet.aptos.connected && (
            <ProfileRow
              icon={<AptosIcon size={24} />}
              name="Aptos"
              address={wallet.aptos.address}
            />
          )}
          {wallet.ethereum.connected && (
            <ProfileRow
              icon={<EthereumIcon size={24} />}
              name="Ethereum"
              address={wallet.ethereum.address}
            />
          )}
          {wallet.solana.connected && (
            <ProfileRow
              icon={<SolanaIcon size={24} />}
              name="Solana"
              address={wallet.solana.address}
            />
          )}
        </div>

        <button
          type="button"
          className="profile-disconnect-all"
          onClick={handleDisconnectAll}
        >
          Disconnect all
        </button>

        <div className="profile-empty">
          <p className="profile-empty-title">Your videos go here</p>
          <p className="profile-empty-hint">
            Upload your first video to Loop
          </p>
          <Link to="/upload" className="profile-empty-cta">
            Upload
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Profile
