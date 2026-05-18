export interface LikesResponse {
  count: number
  isLiked: boolean
}

export interface FollowResponse {
  count: number
  isFollowing: boolean
  followers?: string[]
}

export interface CommentRecord {
  author: string
  text: string
  timestamp: number
}

export interface CommentsResponse {
  comments: CommentRecord[]
  count: number
}

export interface ActivityEventRecord {
  type: 'like' | 'comment' | 'follow'
  from: string
  videoId?: string
  text?: string
  timestamp: number
}

export interface ActivityResponse {
  events: ActivityEventRecord[]
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`POST ${url} failed: ${res.status} ${text}`)
  }
  return res.json() as Promise<T>
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GET ${url} failed: ${res.status} ${text}`)
  }
  return res.json() as Promise<T>
}

export function getLikes(
  videoId: string,
  userAddress?: string,
): Promise<LikesResponse> {
  const q = new URLSearchParams({ videoId })
  if (userAddress) q.set('userAddress', userAddress)
  return getJson<LikesResponse>(`/api/likes?${q.toString()}`)
}

export function toggleLike(
  videoId: string,
  userAddress: string,
  ownerAddress?: string,
  caption?: string,
): Promise<LikesResponse> {
  return postJson<LikesResponse>('/api/likes', {
    videoId,
    userAddress,
    ownerAddress,
    caption,
  })
}

export function getFollow(
  targetAddress: string,
  userAddress?: string,
): Promise<FollowResponse> {
  const q = new URLSearchParams({ targetAddress })
  if (userAddress) q.set('userAddress', userAddress)
  return getJson<FollowResponse>(`/api/follows?${q.toString()}`)
}

export function toggleFollow(
  targetAddress: string,
  userAddress: string,
): Promise<FollowResponse> {
  return postJson<FollowResponse>('/api/follows', {
    targetAddress,
    userAddress,
  })
}

export function getComments(videoId: string): Promise<CommentsResponse> {
  const q = new URLSearchParams({ videoId })
  return getJson<CommentsResponse>(`/api/comments?${q.toString()}`)
}

export function addComment(
  videoId: string,
  userAddress: string,
  text: string,
  ownerAddress?: string,
): Promise<{ comment: CommentRecord }> {
  return postJson<{ comment: CommentRecord }>('/api/comments', {
    videoId,
    userAddress,
    text,
    ownerAddress,
  })
}

export function getActivity(userAddress: string): Promise<ActivityResponse> {
  const q = new URLSearchParams({ userAddress })
  return getJson<ActivityResponse>(`/api/activity?${q.toString()}`)
}
