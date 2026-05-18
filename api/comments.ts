import { Redis } from '@upstash/redis'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const redis = Redis.fromEnv()

interface ActivityEvent {
  type: 'like' | 'comment' | 'follow'
  from: string
  videoId?: string
  text?: string
  timestamp: number
}

interface StoredComment {
  author: string
  text: string
  timestamp: number
}

function readString(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function isValidAddress(addr: unknown): addr is string {
  return (
    typeof addr === 'string' &&
    addr.startsWith('0x') &&
    addr.length >= 10 &&
    addr.length <= 128
  )
}

function isValidVideoId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 256
}

async function pushActivity(
  targetAddress: string,
  event: ActivityEvent,
): Promise<void> {
  const key = `activity:${targetAddress}`
  await redis.lpush(key, JSON.stringify(event))
  await redis.ltrim(key, 0, 199)
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
