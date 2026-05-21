interface Props {
  value: string
  onChange: (value: string) => void
  maxTags?: number
}

export function parseTags(raw: string, maxTags = 6): string[] {
  return raw
    .split(',')
    .map((t) => t.trim().replace(/^#+/, '').trim())
    .filter((t) => t.length > 0)
    .map((t) => t.slice(0, 24))
    .slice(0, maxTags)
}

function TagsInput({ value, onChange, maxTags = 6 }: Props) {
  const preview = parseTags(value, maxTags)

  return (
    <div className="upload-tags">
      <label className="upload-tags-label" htmlFor="upload-tags-field">
        Tags <span className="upload-tags-optional">optional</span>
      </label>
      <input
        id="upload-tags-field"
        className="upload-tags-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="aptos, shelby, demo"
      />
      {preview.length > 0 && (
        <div className="upload-tags-preview">
          {preview.map((tag) => (
            <span key={tag} className="upload-tags-chip">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default TagsInput
