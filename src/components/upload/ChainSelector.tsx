interface Props {
  value: 'APT' | 'ETH' | 'SOL'
  onComingSoon: (chain: 'ETH' | 'SOL') => void
}

function ChainSelector({ value, onComingSoon }: Props) {
  return (
    <div className="upload-chain-block">
      <div className="upload-chain-row">
        <button
          type="button"
          className={`upload-chip${
            value === 'APT' ? ' upload-chip-active' : ''
          }`}
          aria-pressed={value === 'APT'}
        >
          APT
        </button>
        <button
          type="button"
          className="upload-chip upload-chip-disabled"
          onClick={() => onComingSoon('ETH')}
        >
          ETH
        </button>
        <button
          type="button"
          className="upload-chip upload-chip-disabled"
          onClick={() => onComingSoon('SOL')}
        >
          SOL
        </button>
      </div>
      <p className="upload-chain-note">
        APT live via Shelby. ETH and SOL chains coming soon.
      </p>
    </div>
  )
}

export default ChainSelector
