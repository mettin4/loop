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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const userAddress = readString(req.query.userAddress)
    if (!isValidAddress(userAddress)) {
      return res.status(400).json({ error: 'Invalid userAddress' })
    }

    const raw = await redis.lrange(`activity:${userAddress}`, 0, 49)
    const events: ActivityEvent[] = raw
      .map((entry) => {
        if (typeof entry === 'string') {
          try {
            return JSON.parse(entry) as ActivityEvent
          } catch {
            return null
          }
        }
        if (entry && typeof entry === 'object') {
          return entry as ActivityEvent
        }
        return null
      })
      .filter((e): e is ActivityEvent => !!e)

    return res.status(200).json({ events })
  } catch (err) {
    console.error('[api/activity] error:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
