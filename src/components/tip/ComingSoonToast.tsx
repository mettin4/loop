import { useEffect } from 'react'

function InfoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="12" y1="7.5" x2="12" y2="7.5" />
    </svg>
  )
}

interface Props {
  message: string
  onDismiss: () => void
}

function ComingSoonToast({ message, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  return (
    <div className="coming-soon-toast" role="status" aria-live="polite">
      <span className="coming-soon-toast-icon" aria-hidden="true">
        <InfoIcon size={18} />
      </span>
      <span className="coming-soon-toast-text">{message}</span>
    </div>
  )
}

export default ComingSoonToast
