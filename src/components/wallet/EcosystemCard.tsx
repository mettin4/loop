import type { ReactNode } from 'react'
import { ChevronRightIcon } from './icons'

function shortAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

interface Props {
  name: string
  icon: ReactNode
  connected: boolean
  address: string | null
  onSelect: () => void
  onDisconnect: () => void
}

function EcosystemCard({
  name,
  icon,
  connected,
  address,
  onSelect,
  onDisconnect,
}: Props) {
  const status = connected && address ? shortAddress(address) : 'Not connected'

  const handleCardClick = () => {
    if (!connected) onSelect()
  }

  const handleCardKey = (e: React.KeyboardEvent) => {
    if (connected) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDisconnect()
  }

  const handleDisconnectKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      onDisconnect()
    }
  }

  return (
    <div
      className={`ecosystem-card${connected ? ' ecosystem-card-connected' : ''}`}
      role="button"
      tabIndex={connected ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={handleCardKey}
      aria-disabled={connected}
    >
      <span className="ecosystem-card-icon">{icon}</span>
      <span className="ecosystem-card-text">
        <span className="ecosystem-card-name">{name}</span>
        <span className="ecosystem-card-status">{status}</span>
      </span>
      {connected ? (
        <span className="ecosystem-card-right">
          <span className="ecosystem-card-dot" aria-hidden="true" />
          <span
            className="ecosystem-card-disconnect"
            onClick={handleDisconnect}
            role="button"
            tabIndex={0}
            onKeyDown={handleDisconnectKey}
          >
            Disconnect
          </span>
        </span>
      ) : (
        <span className="ecosystem-card-chevron" aria-hidden="true">
          <ChevronRightIcon size={16} />
        </span>
      )}
    </div>
  )
}

export default EcosystemCard
