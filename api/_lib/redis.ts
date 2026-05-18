import { Redis } from '@upstash/redis'

export const redis = Redis.fromEnv()

export function readString(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function isValidAddress(addr: unknown): addr is string {
  return (
    typeof addr === 'string' &&
    addr.startsWith('0x') &&
    addr.length >= 10 &&
    addr.length <= 128
  )
}

export function isValidVideoId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 256
}

export interface ActivityEvent {
  type: 'like' | 'comment' | 'follow'
  from: string
  videoId?: string
  text?: string
  timestamp: number
}

export async function pushActivity(
  targetAddress: string,
  event: ActivityEvent,
): Promise<void> {
  const key = `activity:${targetAddress}`
  await redis.lpush(key, JSON.stringify(event))
  await redis.ltrim(key, 0, 199)
}
