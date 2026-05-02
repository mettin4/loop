import type { LoopWallet } from '../../wallets/useLoopWallet'
import { AptosIcon, ChevronRightIcon, EthereumIcon, SolanaIcon } from './icons'

function shortAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

interface Props {
  wallet: LoopWallet
  onClick: () => void
}

function ConnectedBadge({ wallet, onClick }: Props) {
  const { aptos, ethereum, solana, connectedCount } = wallet

  if (connectedCount === 1) {
    let icon = null
    let address: string | null = null
    if (aptos.connected) {
      icon = <AptosIcon size={16} />
      address = aptos.address
    } else if (ethereum.connected) {
      icon = <EthereumIcon size={16} />
      address = ethereum.address
    } else if (solana.connected) {
      icon = <SolanaIcon size={16} />
      address = solana.address
    }

    return (
      <button
        type="button"
        className="connected-badge"
        onClick={onClick}
        aria-label="Manage wallet connections"
      >
        <span className="connected-badge-icon">{icon}</span>
        <span className="connected-badge-addr">
          {address ? shortAddress(address) : ''}
        </span>
        <span className="connected-badge-chevron">
          <ChevronRightIcon size={12} />
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className="connected-badge connected-badge-multi"
      onClick={onClick}
      aria-label="Manage wallet connections"
    >
      <span className="connected-badge-stack">
        {aptos.connected && (
          <span className="connected-badge-stack-icon">
            <AptosIcon size={14} />
          </span>
        )}
        {ethereum.connected && (
          <span className="connected-badge-stack-icon">
            <EthereumIcon size={14} />
          </span>
        )}
        {solana.connected && (
          <span className="connected-badge-stack-icon">
            <SolanaIcon size={14} />
          </span>
        )}
      </span>
      <span className="connected-badge-count">{connectedCount} connected</span>
      <span className="connected-badge-chevron">
        <ChevronRightIcon size={12} />
      </span>
    </button>
  )
}

export default ConnectedBadge
