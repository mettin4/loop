import { SHELBY_CONFIGS, type ShelbyMode } from './shelbyNetwork'

export type UploadedChain = 'APT' | 'ETH' | 'SOL'

export interface StoredVideo {
  id: string
  blobName: string
  caption: string
  uploaderAddress: string
  chain: UploadedChain
  txHash: string
  uploadedAt: number
  ownerAddress: string
  blobExplorerUrl: string
  /**
   * Shelby network the blob lives on. Older entries (pre-Aptos-Testnet
   * migration) are missing this field and are treated as 'shelbynet'.
   */
  network?: ShelbyMode
}

const KEY = 'loop:uploaded-videos'

function safeParse(raw: string | null): StoredVideo[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is StoredVideo =>
        v &&
        typeof v === 'object' &&
        typeof v.id === 'string' &&
        typeof v.blobName === 'string' &&
        typeof v.ownerAddress === 'string',
    )
  } catch {
    return []
  }
}

export function getUploadedVideos(): StoredVideo[] {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(KEY))
}

export function saveUploadedVideo(video: StoredVideo): void {
  if (typeof window === 'undefined') return
  const existing = getUploadedVideos().filter((v) => v.id !== video.id)
  const next = [video, ...existing]
  window.localStorage.setItem(KEY, JSON.stringify(next))
}

export function getUploadedVideosByOwner(address: string): StoredVideo[] {
  const target = address.toLowerCase()
  return getUploadedVideos().filter(
    (v) => v.ownerAddress.toLowerCase() === target,
  )
}

export function networkOf(video: StoredVideo): ShelbyMode {
  return video.network ?? 'shelbynet'
}

export function getShelbyBlobMediaUrl(
  network: ShelbyMode,
  ownerAddress: string,
  blobName: string,
): string {
  const segments = blobName
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')
  return `${SHELBY_CONFIGS[network].shelbyRpcBase}/blobs/${ownerAddress}/${segments}`
}
