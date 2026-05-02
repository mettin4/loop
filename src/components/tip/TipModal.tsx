import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FeedVideo } from '../../types/video'
import {
  aptosClient,
  buildTipPayload,
  type TipResult,
} from '../../lib/aptosTip'
import { CloseIcon } from '../wallet/icons'
import PresetButton from './PresetButton'
import TipSuccess from './TipSuccess'
import './tip.css'

const PRESETS = [0.001, 0.01, 0.1] as const
const APT_USD_RATE = 10
const MIN_TIP = 0.001

type Selection = number | 'custom'

interface Props {
  video: FeedVideo | null
  isOpen: boolean
  onClose: () => void
}

function TipModal({ video, isOpen, onClose }: Props) {
  const { account, signAndSubmitTransaction } = useWallet()
  const [selection, setSelection] = useState<Selection>(MIN_TIP)
  const [customAmount, setCustomAmount] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TipResult | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setSelection(MIN_TIP)
    setCustomAmount('')
    setError(null)
    setResult(null)
    setLoading(false)
  }, [isOpen, video?.id])

  useEffect(() => {
    if (!isOpen || !account?.address) return
    const address = String(account.address)
    let active = true
    aptosClient
      .getAccountAPTAmount({ accountAddress: address })
      .then((octa) => {
        if (active) setBalance(Number(octa) / 100_000_000)
      })
      .catch((err) => {
        console.error('[Aptos balance]', err)
        if (active) setBalance(0)
      })
    return () => {
      active = false
    }
  }, [isOpen, account?.address, result])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, loading])

  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  if (!isOpen || !video) return null

  const amount =
    selection === 'custom' ? Number(customAmount) : (selection as number)
  const amountValid = Number.isFinite(amount) && amount >= MIN_TIP
  const balanceLow = balance !== null && balance < MIN_TIP
  const insufficient = balance !== null && amountValid && amount > balance
  const hasRecipient = video.recipient && video.recipient.length > 0
  const canSend =
    !loading &&
    amountValid &&
    !insufficient &&
    !balanceLow &&
    hasRecipient &&
    !!account?.address

  const handleSend = async () => {
    if (!canSend || !video) return
    setLoading(true)
    setError(null)

    try {
      const payload = buildTipPayload({
        recipientAddress: video.recipient,
        amountApt: amount,
      })

      const response = await signAndSubmitTransaction({ data: payload })
      await aptosClient.waitForTransaction({
        transactionHash: response.hash,
      })

      setResult({
        hash: response.hash,
        amount,
        recipient: video.recipient,
      })
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : ''

      if (message.includes('rejected') || message.includes('User rejected')) {
        setError('Transaction cancelled')
      } else if (
        message.includes('INSUFFICIENT_BALANCE') ||
        message.toLowerCase().includes('insufficient')
      ) {
        setError('Not enough APT for tip + gas')
      } else if (message.includes('Simulation')) {
        setError('Network simulation failed. Try a smaller amount or refresh.')
      } else {
        setError('Something went wrong. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const usdEstimate = amountValid
    ? `≈ $${(amount * APT_USD_RATE).toFixed(2)} USD`
    : `≈ $0.00 USD`

  return createPortal(
    <div
      className="tip-backdrop"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className="tip-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Send a tip"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="tip-close"
          onClick={onClose}
          aria-label="Close"
          disabled={loading}
        >
          <CloseIcon size={18} />
        </button>

        {result ? (
          <TipSuccess result={result} video={video} onClose={onClose} />
        ) : (
          <>
            <header className="tip-header">
              <img
                className="tip-avatar"
                src={video.avatar}
                alt={`${video.username} avatar`}
                width={40}
                height={40}
              />
              <div className="tip-header-text">
                <div className="tip-username">{video.username}</div>
                <div className="tip-subtitle">Send a tip</div>
              </div>
            </header>

            {balanceLow ? (
              <div className="tip-faucet">
                <p className="tip-faucet-message">Top up testnet APT first</p>
                <a
                  className="tip-faucet-link"
                  href="https://faucet.testnet.aptoslabs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get testnet APT
                </a>
              </div>
            ) : null}

            <div className="tip-presets">
              {PRESETS.map((preset) => (
                <PresetButton
                  key={preset}
                  label={`${preset} APT`}
                  active={selection === preset}
                  onClick={() => setSelection(preset)}
                />
              ))}
              <PresetButton
                label="Custom"
                active={selection === 'custom'}
                onClick={() => setSelection('custom')}
              />
            </div>

            <div className="tip-usd">{usdEstimate}</div>

            {selection === 'custom' && (
              <div className="tip-custom">
                <input
                  className="tip-custom-input"
                  type="number"
                  step="0.001"
                  min={MIN_TIP}
                  placeholder="0.005"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  autoFocus
                />
                <span className="tip-custom-suffix">APT</span>
              </div>
            )}

            <div className="tip-balance">
              {balance === null
                ? 'Loading balance...'
                : `Balance: ${balance.toFixed(4)} APT`}
            </div>

            {error && <div className="tip-error">{error}</div>}
            {!error && selection === 'custom' && customAmount && !amountValid && (
              <div className="tip-error">
                Minimum tip is {MIN_TIP} APT
              </div>
            )}
            {!error && insufficient && (
              <div className="tip-error">Insufficient balance</div>
            )}
            {!error && !hasRecipient && (
              <div className="tip-error">Tip recipient not configured</div>
            )}

            <button
              type="button"
              className="tip-send"
              onClick={handleSend}
              disabled={!canSend}
            >
              {loading ? (
                <>
                  <span className="tip-spinner" aria-hidden="true" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send tip</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default TipModal
