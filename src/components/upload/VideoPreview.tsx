import { useEffect, useState } from 'react'
import { CloseIcon } from '../wallet/icons'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface Props {
  file: File
  onRemove: () => void
}

function VideoPreview({ file, onRemove }: Props) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div className="upload-preview-wrapper">
      <div className="upload-preview">
        {src && (
          <video
            className="upload-preview-video"
            src={src}
            muted
            loop
            autoPlay
            playsInline
            controls
          />
        )}
        <button
          type="button"
          className="upload-preview-remove"
          onClick={onRemove}
          aria-label="Remove video"
        >
          <CloseIcon size={16} />
        </button>
      </div>
      <p className="upload-preview-meta">
        {file.name} · {formatBytes(file.size)}
      </p>
    </div>
  )
}

export default VideoPreview
