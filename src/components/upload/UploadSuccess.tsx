import { useState } from 'react'
import {
  getShelbyExplorerUrl,
  type UploadResult,
} from '../../lib/shelbyUpload'
import { shortAddress } from '../../lib/formatAddress'

function CopyIcon({ size = 14 }: { size?: number }) {
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

function StoredIcon({ size = 16 }: { size?: number }) {
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

function FailedIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6.5" />
      <line x1="8" y1="5" x2="8" y2="9" />
      <circle cx="8" cy="11.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

interface Props {
  result: UploadResult
  caption: string
  onDone: () => void
}

function truncateCaption(text: string, max = 60): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

function UploadSuccess({ result, caption, onDone }: Props) {
  const [copied, setCopied] = useState(false)
  const [blobCopied, setBlobCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (err) {
      console.error(err)
    }
  }

  const handleBlobCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.blobName)
      setBlobCopied(true)
      setTimeout(() => setBlobCopied(false), 1600)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="upload-success">
      <div className="upload-success-pulse" aria-hidden="true">
        <span className="upload-success-dot" />
      </div>
      <h2 className="upload-success-title">
        {result.blobUploaded ? 'Video posted to Loop' : 'Registered on-chain'}
      </h2>
      <p className="upload-success-caption">
        Posted as: {truncateCaption(caption)}
      </p>

      <div className="upload-success-tx">
        <span className="upload-success-tx-label">Transaction</span>
        <button
          type="button"
          className="upload-success-tx-row"
          onClick={handleCopy}
          aria-label="Copy transaction hash"
        >
          <span className="upload-success-tx-hash">
            {shortAddress(result.hash, 8, 6)}
          </span>
          <span className="upload-success-tx-copy">
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          </span>
        </button>
      </div>

      <a
        className="upload-success-explorer"
        href={getShelbyExplorerUrl(result.hash)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>View on Aptos Explorer</span>
        <ExternalIcon size={14} />
      </a>

      {result.blobUploaded ? (
        <div className="upload-success-storage">
          <div className="upload-success-stored-row">
            <span
              className="upload-success-storage-icon"
              aria-hidden="true"
            >
              <StoredIcon size={16} />
            </span>
            <span className="upload-success-storage-text">
              Stored on Shelby
            </span>
          </div>
          <div className="upload-success-blob">
            <span className="upload-success-tx-label">Blob</span>
            <button
              type="button"
              className="upload-success-tx-row"
              onClick={handleBlobCopy}
              aria-label="Copy blob name"
            >
              <span className="upload-success-blob-name">
                {result.blobName}
              </span>
              <span className="upload-success-tx-copy">
                {blobCopied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              </span>
            </button>
          </div>
          {result.blobExplorerUrl && (
            <a
              className="upload-success-explorer"
              href={result.blobExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>View on Shelby Explorer</span>
              <ExternalIcon size={14} />
            </a>
          )}
        </div>
      ) : (
        <div className="upload-success-storage">
          <div className="upload-success-failed-row">
            <span
              className="upload-success-storage-icon"
              aria-hidden="true"
            >
              <FailedIcon size={16} />
            </span>
            <span className="upload-success-storage-text">
              Storage upload failed
            </span>
          </div>
          {result.uploadError && (
            <p className="upload-success-storage-helper">
              {result.uploadError}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className="upload-success-done"
        onClick={onDone}
      >
        Back to feed
      </button>
    </div>
  )
}

export default UploadSuccess
