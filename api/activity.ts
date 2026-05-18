import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  isValidAddress,
  readString,
  redis,
  type ActivityEvent,
} from './_lib/redis'

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
