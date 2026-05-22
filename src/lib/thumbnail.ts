export const THUMBNAIL_WIDTH = 360
export const THUMBNAIL_HEIGHT = 640

function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  w: number,
  h: number,
): void {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) {
    ctx.fillRect(0, 0, w, h)
    return
  }
  const scale = Math.max(w / vw, h / vh)
  const dw = vw * scale
  const dh = vh * scale
  const dx = (w - dw) / 2
  const dy = (h - dh) / 2
  ctx.drawImage(video, dx, dy, dw, dh)
}

/**
 * Capture a single frame from a video file and return it as a JPEG blob,
 * sized to a 9:16 poster. Best-effort: callers should treat failure as
 * non-fatal and skip the thumbnail.
 */
export function generateThumbnailBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    const url = URL.createObjectURL(file)

    let settled = false
    const cleanup = () => {
      URL.revokeObjectURL(url)
      video.removeAttribute('src')
      video.load()
    }
    const fail = (err: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(err)
    }

    const timeout = window.setTimeout(() => {
      fail(new Error('Thumbnail generation timed out'))
    }, 15000)

    video.onloadedmetadata = () => {
      const target = Number.isFinite(video.duration)
        ? Math.min(1, video.duration / 2)
        : 0
      try {
        video.currentTime = target
      } catch {
        video.currentTime = 0
      }
    }

    video.onseeked = () => {
      if (settled) return
      try {
        const canvas = document.createElement('canvas')
        canvas.width = THUMBNAIL_WIDTH
        canvas.height = THUMBNAIL_HEIGHT
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          fail(new Error('Canvas context unavailable'))
          return
        }
        drawVideoCover(ctx, video, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            window.clearTimeout(timeout)
            if (settled) return
            settled = true
            cleanup()
            if (blob) resolve(blob)
            else reject(new Error('Canvas toBlob returned null'))
          },
          'image/jpeg',
          0.8,
        )
      } catch (err) {
        window.clearTimeout(timeout)
        fail(err instanceof Error ? err : new Error('Thumbnail draw failed'))
      }
    }

    video.onerror = () => {
      window.clearTimeout(timeout)
      fail(new Error('Video load failed during thumbnail capture'))
    }

    video.src = url
  })
}
