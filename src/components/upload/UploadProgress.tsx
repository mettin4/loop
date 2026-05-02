import { createPortal } from 'react-dom'
import type { UploadStage } from '../../lib/shelbyUpload'

const STAGE_COPY: Record<UploadStage, { title: string; hint?: string }> = {
  preparing: { title: 'Preparing video...' },
  encoding: { title: 'Encoding for Shelby...' },
  registering: {
    title: 'Registering on-chain...',
    hint: 'Confirm in Petra',
  },
  uploading: { title: 'Uploading to Shelby network...' },
  complete: { title: 'Almost there...' },
}

interface Props {
  stage: UploadStage
}

function UploadProgress({ stage }: Props) {
  const copy = STAGE_COPY[stage]

  return createPortal(
    <div className="upload-progress-backdrop" role="dialog" aria-modal="true">
      <div className="upload-progress">
        <span className="upload-progress-pulse" aria-hidden="true" />
        <h2 className="upload-progress-title">{copy.title}</h2>
        {copy.hint && (
          <p className="upload-progress-hint">{copy.hint}</p>
        )}
        <div className="upload-progress-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default UploadProgress
