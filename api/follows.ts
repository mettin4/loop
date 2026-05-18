import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  isValidAddress,
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
      const targetAddress = readString(req.query.targetAddress)
      const userAddress = readString(req.query.userAddress)

      if (!isValidAddress(targetAddress)) {
        return res.status(400).json({ error: 'Invalid targetAddress' })
      }

      const followersKey = `followers:${targetAddress}`
      const count = await redis.scard(followersKey)
      const followers = await redis.smembers(followersKey)

      let isFollowing = false
      if (userAddress && isValidAddress(userAddress)) {
        isFollowing = !!(await redis.sismember(followersKey, userAddress))
      }

      return res.status(200).json({ count, followers, isFollowing })
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as {
        targetAddress?: unknown
        userAddress?: unknown
      }
      const { targetAddress, userAddress } = body

      if (!isValidAddress(targetAddress)) {
        return res.status(400).json({ error: 'Invalid targetAddress' })
      }
      if (!isValidAddress(userAddress)) {
        return res.status(400).json({ error: 'Invalid userAddress' })
      }
      if (targetAddress.toLowerCase() === userAddress.toLowerCase()) {
        return res.status(400).json({ error: 'Cannot follow yourself' })
      }

      const followersKey = `followers:${targetAddress}`
      const followingKey = `following:${userAddress}`
      const already = await redis.sismember(followersKey, userAddress)

      let isFollowing: boolean
      if (already) {
        const tx = redis.multi()
        tx.srem(followersKey, userAddress)
        tx.srem(followingKey, targetAddress)
        await tx.exec()
        isFollowing = false
      } else {
        const tx = redis.multi()
        tx.sadd(followersKey, userAddress)
        tx.sadd(followingKey, targetAddress)
        await tx.exec()
        isFollowing = true
        await pushActivity(targetAddress, {
          type: 'follow',
          from: userAddress,
          timestamp: Date.now(),
        })
      }

      const count = await redis.scard(followersKey)
      return res.status(200).json({ count, isFollowing })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[api/follows] error:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
