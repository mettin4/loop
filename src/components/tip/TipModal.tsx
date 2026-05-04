import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import {
  useConnection,
  useWallet as useSolanaWallet,
} from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatEther } from 'viem'
import { useAccount, useConfig } from 'wagmi'
import { getBalance } from 'wagmi/actions'
import { sepolia } from 'wagmi/chains'
import {
  aptosClient,
  buildTipPayload,
  type TipResult,
} from '../../lib/aptosTip'
import { sendEthTip } from '../../lib/ethereumTip'
import { sendSolTip } from '../../lib/solanaTip'
import { tipConfigs } from '../../lib/tipConfig'
import type { FeedVideo } from '../../types/video'
import { CloseIcon } from '../wallet/icons'
import PresetButton from './PresetButton'
import TipSuccess from './TipSuccess'
import './tip.css'

type Selection = number | 'custom'

interface Props {
  video: FeedVideo | null
  isOpen: boolean
  onClose: () => void
}

function TipModal({ video, isOpen, onClose }: Props) {
  const aptos = useAptosWallet()
  const ethAccount = useAccount()
  const ethConfig = useConfig()
  const sol = useSolanaWallet()
  const { connection } = useConnection()

  const config = video ? tipConfigs[video.chain] : null

  const [selection, setSelection] = useState<Selection>(0.001)
  const [customAmount, setCustomAmount] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TipResult | null>(null)

  useEffect(() => {
    if (!isOpen || !config) return
    setSelection(config.presets[0])
    setCustomAmount('')
    setError(null)
    setResult(null)
    setLoading(false)
  }, [isOpen, video?.id, config])

  const currentAddress = (() => {
    if (!video) return null
    if (video.chain === 'APT') {
      return aptos.account?.address ? String(aptos.account.address) : null
    }
    if (video.chain === 'ETH') return ethAccount.address ?? null
    if (video.chain === 'SOL') {
      return sol.publicKey ? sol.publicKey.toBase58() : null
    }
    return null
  })()

  useEffect(() => {
    if (!isOpen || !video || !currentAddress) {
      setBalance(null)
      return
    }

    let active = true
    setBalance(null)

    const fetchBalance = async () => {
      try {
        if (video.chain === 'APT') {
          const octa = await aptosClient.getAccountAPTAmount({
            accountAddress: currentAddress,
          })
          if (active) setBalance(Number(octa) / 100_000_000)
        } else if (video.chain === 'ETH') {
          const result = await getBalance(ethConfig, {
            address: currentAddress as `0x${string}`,
            chainId: sepolia.id,
          })
          if (active) setBalance(Number(formatEther(result.value)))
        } else if (video.chain === 'SOL' && sol.publicKey) {
          const lamports = await connection.getBalance(sol.publicKey)
          if (active) setBalance(lamports / LAMPORTS_PER_SOL)
        }
      } catch (err) {
        console.error('[Balance fetch]', err)
        if (active) setBalance(0)
      }
    }

    fetchBalance()
    return () => {
      active = false
    }
  }, [
    isOpen,
    video?.chain,
    currentAddress,
    ethConfig,
    connection,
    sol.publicKey,
    result,
  ])

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

  if (!isOpen || !video || !config) return null

  const amount =
    selection === 'custom' ? Number(customAmount) : (selection as number)
  const amountValid = Number.isFinite(amount) && amount >= config.minAmount
  const balanceLow = balance !== null && balance < config.minAmount
  const insufficient = balance !== null && amountValid && amount > balance
  const hasRecipient = config.recipient && config.recipient.length > 0
  const canSend =
    !loading &&
    amountValid &&
    !insufficient &&
    !balanceLow &&
    hasRecipient &&
    !!currentAddress

  const handleSend = async () => {
    if (!canSend || !video || !config) return
    setLoading(true)
    setError(null)

    try {
      let hash: string

      if (video.chain === 'APT') {
        const payload = buildTipPayload({
          recipientAddress: config.recipient,
          amountApt: amount,
        })
        const response = await aptos.signAndSubmitTransaction({
          data: payload,
        })
        await aptosClient.waitForTransaction({
          transactionHash: response.hash,
        })
        hash = response.hash
      } else if (video.chain === 'ETH') {
        const ethResult = await sendEthTip({
          recipient: config.recipient,
          amountEth: amount,
          config: ethConfig,
        })
        hash = ethResult.hash
      } else {
        const solResult = await sendSolTip({
          recipient: config.recipient,
          amountSol: amount,
          wallet: sol,
          connection,
        })
        hash = solResult.hash
      }

      setResult({
        hash,
        amount,
        recipient: config.recipient,
      })
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : ''

      if (
        message.includes('rejected') ||
        message.includes('User rejected') ||
        message.includes('User denied') ||
        message.includes('WalletSendTransactionError')
      ) {
        setError('Transaction cancelled')
      } else if (
        message.includes('INSUFFICIENT_BALANCE') ||
        message.toLowerCase().includes('insufficient')
      ) {
        setError(`Not enough ${config.symbol} for tip + gas`)
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
    ? `≈ $${(amount * config.usdRate).toFixed(2)} USD`
    : '≈ $0.00 USD'

  const customPlaceholder = (config.minAmount * 5).toString()

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
          <TipSuccess
            result={result}
            video={video}
            config={config}
            onClose={onClose}
          />
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
                <p className="tip-faucet-message">
                  Top up testnet {config.symbol} first
                </p>
                <a
                  className="tip-faucet-link"
                  href={config.faucetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get testnet {config.symbol}
                </a>
              </div>
            ) : null}

            <div className="tip-presets">
              {config.presets.map((preset) => (
                <PresetButton
                  key={preset}
                  label={`${preset} ${config.symbol}`}
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
                  step={config.minAmount}
                  min={config.minAmount}
                  placeholder={customPlaceholder}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  autoFocus
                />
                <span className="tip-custom-suffix">{config.symbol}</span>
              </div>
            )}

            <div className="tip-balance">
              {balance === null
                ? 'Loading balance...'
                : `Balance: ${balance.toFixed(4)} ${config.symbol}`}
            </div>

            {error && <div className="tip-error">{error}</div>}
            {!error &&
              selection === 'custom' &&
              customAmount &&
              !amountValid && (
                <div className="tip-error">
                  Minimum tip is {config.minAmount} {config.symbol}
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
