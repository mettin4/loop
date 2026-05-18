import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  isValidAddress,
  isValidVideoId,
  pushActivity,
  readString,
  redis,
} from '../src/lib/redis'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    if (req.method === 'GET') {
      const videoId = readString(req.query.videoId)
      const userAddress = readString(req.query.userAddress)

      if (!isValidVideoId(videoId)) {
        return res.status(400).json({ error: 'Invalid videoId' })
      }

      const key = `likes:${videoId}`
      const count = await redis.scard(key)

      if (userAddress && isValidAddress(userAddress)) {
        const isLiked = await redis.sismember(key, userAddress)
        return res.status(200).json({ count, isLiked: !!isLiked })
      }
      return res.status(200).json({ count, isLiked: false })
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as {
        videoId?: unknown
        userAddress?: unknown
        ownerAddress?: unknown
        caption?: unknown
      }
      const { videoId, userAddress, ownerAddress, caption } = body

      if (!isValidVideoId(videoId)) {
        return res.status(400).json({ error: 'Invalid videoId' })
      }
      if (!isValidAddress(userAddress)) {
        return res.status(400).json({ error: 'Invalid userAddress' })
      }

      const key = `likes:${videoId}`
      const already = await redis.sismember(key, userAddress)

      let isLiked: boolean
      if (already) {
        await redis.srem(key, userAddress)
        isLiked = false
      } else {
        await redis.sadd(key, userAddress)
        isLiked = true
        if (
          isValidAddress(ownerAddress) &&
          ownerAddress.toLowerCase() !== userAddress.toLowerCase()
        ) {
          await pushActivity(ownerAddress, {
            type: 'like',
            from: userAddress,
            videoId,
            text: typeof caption === 'string' ? caption.slice(0, 200) : '',
            timestamp: Date.now(),
          })
        }
      }

      const count = await redis.scard(key)
      return res.status(200).json({ count, isLiked })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[api/likes] error:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
