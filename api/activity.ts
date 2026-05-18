import { Redis } from '@upstash/redis'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const redis = Redis.fromEnv()

interface ActivityEvent {
  type: 'like' | 'comment' | 'follow' | 'tip'
  from: string
  videoId?: string
  text?: string
  amount?: number
  chain?: string
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

function isValidWalletId(addr: unknown): addr is string {
  return (
    typeof addr === 'string' &&
    addr.length >= 10 &&
    addr.length <= 128 &&
    /^[A-Za-z0-9]+$/.test(addr)
  )
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    if (req.method === 'GET') {
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
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as {
        targetAddress?: unknown
        type?: unknown
        from?: unknown
        videoId?: unknown
        amount?: unknown
        chain?: unknown
      }
      const { targetAddress, type, from, videoId, amount, chain } = body

      if (type !== 'tip') {
        return res.status(400).json({ error: 'Only tip events accepted' })
      }
      if (!isValidAddress(targetAddress)) {
        return res.status(400).json({ error: 'Invalid targetAddress' })
      }
      if (!isValidWalletId(from)) {
        return res.status(400).json({ error: 'Invalid from' })
      }
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' })
      }
      if (typeof chain !== 'string' || chain.length === 0 || chain.length > 16) {
        return res.status(400).json({ error: 'Invalid chain' })
      }
      if (
        videoId !== undefined &&
        (typeof videoId !== 'string' || videoId.length === 0 || videoId.length > 256)
      ) {
        return res.status(400).json({ error: 'Invalid videoId' })
      }
      if (targetAddress.toLowerCase() === from.toLowerCase()) {
        return res.status(200).json({ ok: true, skipped: 'self' })
      }

      const event: ActivityEvent = {
        type: 'tip',
        from,
        videoId: typeof videoId === 'string' ? videoId : undefined,
        amount,
        chain,
        timestamp: Date.now(),
      }
      const key = `activity:${targetAddress}`
      await redis.lpush(key, JSON.stringify(event))
      await redis.ltrim(key, 0, 199)

      return res.status(200).json({ ok: true, event })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[api/activity] error:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
