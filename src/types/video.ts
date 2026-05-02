export interface FeedVideo {
  id: string
  username: string
  avatar: string
  bio: string
  caption: string
  chain: 'APT' | 'ETH' | 'SOL'
  dominantColor: string
  duration: number
  likes: number
  comments: number
  tips: number
  shares: number
  recipient: string
}
