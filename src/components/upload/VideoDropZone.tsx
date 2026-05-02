import { useRef, useState } from 'react'

const MAX_BYTES = 30 * 1024 * 1024
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

function UploadGlyph() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 32 L24 12" />
      <path d="M16 20 L24 12 L32 20" />
      <path d="M8 32 L8 38 A2 2 0 0 0 10 40 L38 40 A2 2 0 0 0 40 38 L40 32" />
    </svg>
  )
}

interface Props {
  onFile: (file: File) => void
  onError: (message: string) => void
}

function VideoDropZone({ onFile, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const validate = (file: File): string | null => {
    if (file.size > MAX_BYTES) return 'Video too large. Max 30 MB.'
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Use MP4, MOV, or WebM.'
    }
    return null
  }

  const handleFile = (file: File) => {
    const error = validate(file)
    if (error) {
      onError(error)
      return
    }
    onFile(file)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={`upload-dropzone${dragOver ? ' upload-dropzone-active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKey}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="upload-dropzone-input"
        onChange={handleChange}
      />
      <span className="upload-dropzone-icon" aria-hidden="true">
        <UploadGlyph />
      </span>
      <span className="upload-dropzone-title">
        {dragOver ? 'Release to upload' : 'Drop a video'}
      </span>
      <span className="upload-dropzone-hint">or click to browse</span>
      <span className="upload-dropzone-meta">
        Up to 30 MB. MP4, MOV, WebM.
      </span>
    </div>
  )
}

export default VideoDropZone
