export function videoShareUrl(owner: string, blobName: string): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://loop-chi-ten.vercel.app'
  return `${origin}/v/${encodeURIComponent(owner)}/${encodeURIComponent(blobName)}`
}

export async function copyVideoShareLink(
  owner: string,
  blobName: string,
): Promise<boolean> {
  const url = videoShareUrl(owner, blobName)
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      return true
    }
  } catch (err) {
    console.error('[share] clipboard write failed:', err)
  }
  return false
}
