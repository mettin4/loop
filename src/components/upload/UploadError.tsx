interface Props {
  message: string
  onRetry: () => void
  onCancel: () => void
}

function UploadError({ message, onRetry, onCancel }: Props) {
  return (
    <div className="upload-error">
      <h2 className="upload-error-title">Upload failed</h2>
      <p className="upload-error-message">{message}</p>
      <button
        type="button"
        className="upload-error-retry"
        onClick={onRetry}
      >
        Try again
      </button>
      <button
        type="button"
        className="upload-error-cancel"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  )
}

export default UploadError
