type Props = { size?: number }

function EthereumIcon({ size = 32 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 3 L8 17 L16 21 L24 17 Z" opacity="0.85" />
      <path d="M16 23 L8 18.5 L16 29 L24 18.5 Z" />
    </svg>
  )
}

export default EthereumIcon
