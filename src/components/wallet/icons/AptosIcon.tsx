type Props = { size?: number }

function AptosIcon({ size = 32 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24.5 11.8h-2.7l-1.4-1.6c-.2-.2-.4-.3-.7-.3s-.5.1-.7.3l-1.2 1.6H7.5c-.6 0-1 .5-1 1s.4 1 1 1h11.4l1.4-1.6.5.5h3.7c.6 0 1-.5 1-1s-.4-1-1-1zM7.5 17.8h2.7l1.4 1.6c.2.2.4.3.7.3s.5-.1.7-.3l1.2-1.6h10.3c.6 0 1-.5 1-1s-.4-1-1-1H13.1l-1.4 1.6-.5-.5H7.5c-.6 0-1 .5-1 1s.4 1 1 1z"
        fill="currentColor"
      />
      <path
        d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm0 26C9.4 28 4 22.6 4 16S9.4 4 16 4s12 5.4 12 12-5.4 12-12 12z"
        fill="currentColor"
      />
    </svg>
  )
}

export default AptosIcon
