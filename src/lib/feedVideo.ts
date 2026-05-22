import { shortAddress } from './formatAddress'
import {
  getShelbyBlobMediaUrl,
  networkOf,
  type StoredVideo,
} from './videoStorage'
import type { FeedVideo } from '../types/video'

export function avatarFor(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}`
}

const UPLOAD_AMBIENT_COLORS = [
  '#3d4d8a',
  '#1a7a8a',
  '#a64d2a',
  '#6b3d8a',
  '#a63d5a',
  '#3d4dab',
  '#ff3366',
  '#00ffaa',
]

export function dominantColorFromAddress(address: string): string {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash) % UPLOAD_AMBIENT_COLORS.length
  return UPLOAD_AMBIENT_COLORS[idx]
}

export function uploadedToFeedVideo(stored: StoredVideo): FeedVideo {
  const handle = `@${shortAddress(stored.uploaderAddress, 4, 4)}`
  const network = networkOf(stored)
  return {
    id: `uploaded:${stored.id}`,
    username: handle,
    avatar: avatarFor(stored.uploaderAddress),
    bio: 'Uploaded to Loop',
    caption: stored.caption || 'Untitled',
    tags: stored.tags,
    thumbnailUrl: stored.thumbnailUrl,
    chain: stored.chain,
    dominantColor: dominantColorFromAddress(stored.uploaderAddress),
    duration: 0,
    likes: 0,
    comments: 0,
    tips: 0,
    shares: 0,
    videoUrl: getShelbyBlobMediaUrl(
      network,
      stored.ownerAddress,
      stored.blobName,
    ),
    isUploaded: true,
    network,
    ownerAddress: stored.ownerAddress,
    blobName: stored.blobName,
    blobExplorerUrl: stored.blobExplorerUrl,
    txHash: stored.txHash,
  }
}
