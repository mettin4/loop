import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import {
  useWallet as useSolanaWallet,
  type Wallet,
} from '@solana/wallet-adapter-react'
import { WalletReadyState, type WalletName } from '@solana/wallet-adapter-base'
import { useEffect, useRef } from 'react'
import { useConnect, useConnectors } from 'wagmi'
import type { Connector } from 'wagmi'
import type { Ecosystem } from '../../wallets/useLoopWallet'
import { ArrowLeftIcon, ChevronRightIcon } from './icons'

interface Props {
  ecosystem: Ecosystem
  onBack: () => void
  onConnected: () => void
}

function WalletList({ ecosystem, onBack, onConnected }: Props) {
  return (
    <div className="wallet-list">
      <button type="button" className="wallet-list-back" onClick={onBack}>
        <ArrowLeftIcon size={14} />
        <span>Back</span>
      </button>
      {ecosystem === 'aptos' && <AptosList onConnected={onConnected} />}
      {ecosystem === 'ethereum' && <EthereumList onConnected={onConnected} />}
      {ecosystem === 'solana' && <SolanaList onConnected={onConnected} />}
    </div>
  )
}

function AptosList({ onConnected }: { onConnected: () => void }) {
  const aptos = useAptosWallet()
  const installed = aptos.wallets
    .filter((w) => w.readyState === 'Installed')
    .filter((w) => {
      const name = w.name.toLowerCase()
      return (
        !name.includes('continue with') &&
        !name.includes('google') &&
        !name.includes('apple') &&
        !name.includes('aptos connect')
      )
    })

  const handleConnect = async (name: string) => {
    try {
      await aptos.connect(name)
      onConnected()
    } catch (err) {
      console.error('[Aptos connect]', err)
    }
  }

  if (installed.length === 0) {
    return (
      <Empty
        message="No Aptos wallet detected. Install Petra to continue."
        link={{ href: 'https://petra.app', label: 'Get Petra' }}
      />
    )
  }

  return (
    <div className="wallet-rows">
      {installed.map((w) => (
        <button
          type="button"
          key={w.name}
          className="wallet-row"
          onClick={() => handleConnect(w.name)}
        >
          <img className="wallet-row-icon" src={w.icon} alt="" />
          <span className="wallet-row-name">{w.name}</span>
          <ChevronRightIcon size={14} />
        </button>
      ))}
    </div>
  )
}

function EthereumList({ onConnected }: { onConnected: () => void }) {
  const connectors = useConnectors()
  const { connect } = useConnect()

  const seen = new Set<string>()
  const usable: Connector[] = []
  for (const c of connectors) {
    const key = c.name?.toLowerCase() ?? c.id
    if (seen.has(key)) continue
    seen.add(key)
    usable.push(c)
  }

  const handleConnect = (connector: Connector) => {
    connect(
      { connector },
      {
        onSuccess: () => onConnected(),
        onError: (err) => console.error('[Ethereum connect]', err),
      },
    )
  }

  if (usable.length === 0) {
    return (
      <Empty
        message="No Ethereum wallets detected"
        link={{ href: 'https://metamask.io', label: 'Get MetaMask' }}
      />
    )
  }

  return (
    <div className="wallet-rows">
      {usable.map((c) => (
        <button
          type="button"
          key={c.uid}
          className="wallet-row"
          onClick={() => handleConnect(c)}
        >
          {c.icon ? (
            <img className="wallet-row-icon" src={c.icon} alt="" />
          ) : (
            <span className="wallet-row-icon-fallback">
              {c.name?.charAt(0) ?? '?'}
            </span>
          )}
          <span className="wallet-row-name">{c.name}</span>
          <ChevronRightIcon size={14} />
        </button>
      ))}
    </div>
  )
}

function SolanaList({ onConnected }: { onConnected: () => void }) {
  const sol = useSolanaWallet()
  const pendingRef = useRef<string | null>(null)

  const installed: Wallet[] = sol.wallets.filter(
    (w) => w.readyState === WalletReadyState.Installed,
  )

  useEffect(() => {
    if (
      pendingRef.current &&
      sol.wallet?.adapter.name === pendingRef.current &&
      !sol.connected &&
      !sol.connecting
    ) {
      pendingRef.current = null
      sol
        .connect()
        .then(() => onConnected())
        .catch((err) => console.error('[Solana connect]', err))
    }
  }, [sol, onConnected])

  const handleConnect = (name: string) => {
    if (sol.wallet?.adapter.name === name && !sol.connected) {
      sol
        .connect()
        .then(() => onConnected())
        .catch((err) => console.error('[Solana connect]', err))
      return
    }
    pendingRef.current = name
    sol.select(name as WalletName)
  }

  if (installed.length === 0) {
    return (
      <Empty
        message="No Solana wallets detected"
        link={{ href: 'https://phantom.com', label: 'Get Phantom' }}
      />
    )
  }

  return (
    <div className="wallet-rows">
      {installed.map((w) => (
        <button
          type="button"
          key={w.adapter.name}
          className="wallet-row"
          onClick={() => handleConnect(w.adapter.name)}
        >
          <img className="wallet-row-icon" src={w.adapter.icon} alt="" />
          <span className="wallet-row-name">{w.adapter.name}</span>
          <ChevronRightIcon size={14} />
        </button>
      ))}
    </div>
  )
}

function Empty({
  message,
  link,
}: {
  message: string
  link: { href: string; label: string }
}) {
  return (
    <div className="wallet-empty">
      <p className="wallet-empty-message">{message}</p>
      <a
        className="wallet-empty-link"
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {link.label}
      </a>
    </div>
  )
}

export default WalletList
