export interface FeedVideo {
  id: string
  username: string
  avatar: string
  bio: string
  caption: string
  tags?: string[]
  thumbnailUrl?: string
  chain: 'APT' | 'ETH' | 'SOL'
  dominantColor: string
  duration: number
  likes: number
  comments: number
  tips: number
  shares: number
  videoUrl?: string
  isUploaded?: boolean
  network?: 'shelbynet' | 'aptos-testnet'
  ownerAddress?: string
  blobName?: string
  blobExplorerUrl?: string
  txHash?: string
}
