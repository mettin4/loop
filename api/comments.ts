import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  isValidAddress,
  isValidVideoId,
  pushActivity,
  readString,
  redis,
} from './_lib/redis'

interface StoredComment {
  author: string
  text: string
  timestamp: number
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    if (req.method === 'GET') {
      const videoId = readString(req.query.videoId)

      if (!isValidVideoId(videoId)) {
        return res.status(400).json({ error: 'Invalid videoId' })
      }

      const raw = await redis.lrange(`comments:${videoId}`, 0, 99)
      const comments: StoredComment[] = raw
        .map((entry) => {
          if (typeof entry === 'string') {
            try {
              return JSON.parse(entry) as StoredComment
            } catch {
              return null
            }
          }
          if (entry && typeof entry === 'object') {
            return entry as StoredComment
          }
          return null
        })
        .filter((c): c is StoredComment => !!c)

      return res.status(200).json({ comments, count: comments.length })
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as {
        videoId?: unknown
        userAddress?: unknown
        text?: unknown
        ownerAddress?: unknown
      }
      const { videoId, userAddress, text, ownerAddress } = body

      if (!isValidVideoId(videoId)) {
        return res.status(400).json({ error: 'Invalid videoId' })
      }
      if (!isValidAddress(userAddress)) {
        return res.status(400).json({ error: 'Invalid userAddress' })
      }
      if (typeof text !== 'string') {
        return res.status(400).json({ error: 'Invalid text' })
      }
      const trimmed = text.trim()
      if (trimmed.length === 0) {
        return res.status(400).json({ error: 'Empty comment' })
      }
      if (trimmed.length > 280) {
        return res.status(400).json({ error: 'Comment too long' })
      }

      const comment: StoredComment = {
        author: userAddress,
        text: trimmed,
        timestamp: Date.now(),
      }

      const key = `comments:${videoId}`
      await redis.lpush(key, JSON.stringify(comment))
      await redis.ltrim(key, 0, 499)

      if (
        isValidAddress(ownerAddress) &&
        ownerAddress.toLowerCase() !== userAddress.toLowerCase()
      ) {
        await pushActivity(ownerAddress, {
          type: 'comment',
          from: userAddress,
          videoId,
          text: trimmed.slice(0, 200),
          timestamp: comment.timestamp,
        })
      }

      return res.status(200).json({ comment })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[api/comments] error:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
