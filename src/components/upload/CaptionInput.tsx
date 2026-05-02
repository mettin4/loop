interface Props {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

function CaptionInput({ value, onChange, maxLength = 200 }: Props) {
  const count = value.length
  const overLimit = count > maxLength
  const warn = count > maxLength - 20

  const counterClass = overLimit
    ? 'upload-counter upload-counter-error'
    : warn
      ? 'upload-counter upload-counter-warn'
      : 'upload-counter'

  return (
    <div className="upload-caption">
      <textarea
        className="upload-caption-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What's this video about?"
        rows={3}
      />
      <div className={counterClass}>
        {count} / {maxLength}
      </div>
    </div>
  )
}

export default CaptionInput
