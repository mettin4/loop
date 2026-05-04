import { useState } from 'react'
import type { FeedVideo } from '../../types/video'
import type { TipResult } from '../../lib/aptosTip'
import type { TipConfig } from '../../lib/tipConfig'
import { shortAddress } from '../../lib/formatAddress'

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
  )
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 8 7 12 13 4" />
    </svg>
  )
}

function ExternalIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3h4v4" />
      <line x1="13" y1="3" x2="7" y2="9" />
      <path d="M11 9.5V12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 12V6.5A1.5 1.5 0 0 1 4 5h2.5" />
    </svg>
  )
}

interface Props {
  result: TipResult
  video: FeedVideo
  config: TipConfig
  onClose: () => void
}

function TipSuccess({ result, video, config, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="tip-success">
      <div className="tip-success-pulse" aria-hidden="true">
        <span className="tip-success-dot" />
      </div>
      <h2 className="tip-success-title">Tipped</h2>
      <p className="tip-success-amount">
        {result.amount} {config.symbol} to {video.username}
      </p>

      <div className="tip-success-tx">
        <span className="tip-success-tx-label">Transaction</span>
        <button
          type="button"
          className="tip-success-tx-row"
          onClick={handleCopy}
          aria-label="Copy transaction hash"
        >
          <span className="tip-success-tx-hash">
            {shortAddress(result.hash, 8, 6)}
          </span>
          <span className="tip-success-tx-copy">
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          </span>
        </button>
      </div>

      <a
        className="tip-success-explorer"
        href={config.getExplorerTxUrl(result.hash)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>View on {config.explorerName}</span>
        <ExternalIcon size={14} />
      </a>

      <button
        type="button"
        className="tip-success-done"
        onClick={onClose}
      >
        Done
      </button>
    </div>
  )
}

export default TipSuccess
