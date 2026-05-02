type Props = { size?: number }

function SolanaIcon({ size = 32 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 9 L23 9 L25 13 L9 13 Z" />
      <path d="M7 14 L23 14 L25 18 L9 18 Z" opacity="0.85" />
      <path d="M7 19 L23 19 L25 23 L9 23 Z" opacity="0.7" />
    </svg>
  )
}

export default SolanaIcon
