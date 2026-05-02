import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLoopWallet, type Ecosystem } from '../../wallets/useLoopWallet'
import EcosystemCard from './EcosystemCard'
import WalletList from './WalletList'
import {
  AptosIcon,
  CloseIcon,
  EthereumIcon,
  SolanaIcon,
} from './icons'
import './wallet.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  preselect?: Ecosystem | null
}

function WalletModal({ isOpen, onClose, preselect = null }: Props) {
  const [selected, setSelected] = useState<Ecosystem | null>(null)
  const wallet = useLoopWallet()

  useEffect(() => {
    if (!isOpen) {
      setSelected(null)
      return
    }
    if (preselect) {
      setSelected(preselect)
    }
  }, [isOpen, preselect])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selected) setSelected(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, selected])

  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConnected = () => {
    setSelected(null)
  }

  return createPortal(
    <div className="wallet-modal-backdrop" onClick={onClose}>
      <div
        className="wallet-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Connect wallet"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wallet-modal-header">
          <div>
            <h2 className="wallet-modal-title">Connect</h2>
            <p className="wallet-modal-subtitle">Pick a chain to get started</p>
          </div>
          <button
            type="button"
            className="wallet-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </header>

        <div className="wallet-modal-body">
          {selected === null ? (
            <div className="ecosystem-list">
              <EcosystemCard
                name="Aptos"
                icon={<AptosIcon size={28} />}
                connected={wallet.aptos.connected}
                address={wallet.aptos.address}
                onSelect={() => setSelected('aptos')}
                onDisconnect={wallet.aptos.disconnect}
              />
              <EcosystemCard
                name="Ethereum"
                icon={<EthereumIcon size={28} />}
                connected={wallet.ethereum.connected}
                address={wallet.ethereum.address}
                onSelect={() => setSelected('ethereum')}
                onDisconnect={wallet.ethereum.disconnect}
              />
              <EcosystemCard
                name="Solana"
                icon={<SolanaIcon size={28} />}
                connected={wallet.solana.connected}
                address={wallet.solana.address}
                onSelect={() => setSelected('solana')}
                onDisconnect={wallet.solana.disconnect}
              />
            </div>
          ) : (
            <WalletList
              ecosystem={selected}
              onBack={() => setSelected(null)}
              onConnected={handleConnected}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default WalletModal
