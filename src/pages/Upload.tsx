import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ComingSoonToast from '../components/tip/ComingSoonToast'
import CaptionInput from '../components/upload/CaptionInput'
import ChainSelector from '../components/upload/ChainSelector'
import UploadDropZone from '../components/upload/VideoDropZone'
import UploadError from '../components/upload/UploadError'
import UploadProgress from '../components/upload/UploadProgress'
import UploadSuccess from '../components/upload/UploadSuccess'
import VideoPreview from '../components/upload/VideoPreview'
import '../components/upload/upload.css'
import {
  uploadVideoToShelby,
  type UploadResult,
  type UploadStage,
} from '../lib/shelbyUpload'
import { saveUploadedVideo } from '../lib/videoStorage'
import { useLoopWallet } from '../wallets/useLoopWallet'
import { useWalletModal } from '../wallets/WalletModalContext'

type Chain = 'APT' | 'ETH' | 'SOL'
type Stage = 'idle' | 'uploading' | 'success' | 'error'

const MAX_CAPTION = 200

function chainName(c: Exclude<Chain, 'APT'>): string {
  return c === 'ETH' ? 'Ethereum' : 'Solana'
}

function Upload() {
  const navigate = useNavigate()
  const wallet = useLoopWallet()
  const walletModal = useWalletModal()
  const aptos = useAptosWallet()

  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [progressStage, setProgressStage] = useState<UploadStage>('preparing')
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const aptosConnected = wallet.aptos.connected && !!aptos.account?.address

  const captionTooLong = caption.length > MAX_CAPTION
  const canSubmit =
    !!file &&
    caption.trim().length > 0 &&
    !captionTooLong &&
    stage !== 'uploading'

  const handleFileSelected = (f: File) => {
    setFile(f)
    setFormError(null)
  }

  const handleSubmit = async () => {
    if (!aptosConnected) {
      walletModal.open({ preselect: 'aptos' })
      return
    }
    if (!file || !aptos.account || !canSubmit) return

    setStage('uploading')
    setProgressStage('preparing')
    setErrorMessage(null)

    try {
      const uploadResult = await uploadVideoToShelby({
        file,
        caption,
        account: { address: String(aptos.account.address) },
        signAndSubmitTransaction: aptos.signAndSubmitTransaction,
        onProgress: setProgressStage,
      })

      if (uploadResult.blobUploaded && uploadResult.blobExplorerUrl) {
        saveUploadedVideo({
          id: uploadResult.blobName,
          blobName: uploadResult.blobName,
          caption: caption.trim(),
          uploaderAddress: String(aptos.account.address),
          chain: 'APT',
          txHash: uploadResult.hash,
          uploadedAt: Date.now(),
          ownerAddress: uploadResult.ownerAddress,
          blobExplorerUrl: uploadResult.blobExplorerUrl,
          network: uploadResult.network,
        })
      }

      setResult(uploadResult)
      setStage('success')
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : ''

      if (message.includes('rejected') || message.includes('User rejected')) {
        setErrorMessage('Transaction cancelled')
      } else if (
        message.includes('INSUFFICIENT_BALANCE') ||
        message.toLowerCase().includes('insufficient')
      ) {
        setErrorMessage('Not enough APT for registration + gas')
      } else if (message.includes('Simulation')) {
        setErrorMessage('Network simulation failed. Try again.')
      } else {
        setErrorMessage('Network issue. Try again.')
      }

      setStage('error')
    }
  }

  const handleRetry = () => {
    setStage('idle')
    setErrorMessage(null)
  }

  const submitLabel = !aptosConnected
    ? 'Connect Aptos wallet'
    : stage === 'uploading'
      ? 'Uploading...'
      : 'Upload'

  return (
    <div className="upload-page">
      <div className="upload-shell">
        <header className="upload-header">
          <h1 className="upload-title">Upload</h1>
          <p className="upload-subtitle">
            Post to Loop. Your video, your chain, your wallet.
          </p>
        </header>

        {stage === 'idle' && (
          <div
            className={`upload-form${file ? ' upload-form-with-preview' : ''}`}
          >
            <div className="upload-form-media">
              {file ? (
                <VideoPreview
                  file={file}
                  onRemove={() => setFile(null)}
                />
              ) : (
                <UploadDropZone
                  onFile={handleFileSelected}
                  onError={setFormError}
                />
              )}
            </div>

            <div className="upload-form-fields">
              <CaptionInput
                value={caption}
                onChange={setCaption}
                maxLength={MAX_CAPTION}
              />

              <ChainSelector
                value="APT"
                onComingSoon={(c) =>
                  setToastMessage(
                    `Posting on ${chainName(c)} coming soon`,
                  )
                }
              />

              {formError && (
                <p className="upload-form-error">{formError}</p>
              )}

              <button
                type="button"
                className="upload-submit"
                onClick={handleSubmit}
                disabled={aptosConnected ? !canSubmit : false}
              >
                {submitLabel}
              </button>
            </div>
          </div>
        )}

        {stage === 'uploading' && <UploadProgress stage={progressStage} />}

        {stage === 'success' && result && (
          <UploadSuccess
            result={result}
            caption={caption}
            onDone={() => navigate('/feed')}
          />
        )}

        {stage === 'error' && errorMessage && (
          <UploadError
            message={errorMessage}
            onRetry={handleRetry}
            onCancel={() => navigate('/feed')}
          />
        )}
      </div>

      {toastMessage && (
        <ComingSoonToast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </div>
  )
}

export default Upload
