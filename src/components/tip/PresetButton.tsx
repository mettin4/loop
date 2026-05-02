interface Props {
  label: string
  active: boolean
  onClick: () => void
}

function PresetButton({ label, active, onClick }: Props) {
  return (
    <button
      type="button"
      className={`preset-btn${active ? ' preset-btn-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default PresetButton
