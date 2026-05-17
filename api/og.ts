import type { VercelRequest, VercelResponse } from '@vercel/node'

const SITE_ORIGIN = 'https://loop-chi-ten.vercel.app'
const RPC_BASE = 'https://api.testnet.shelby.xyz/shelby/v1'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function shortAddress(addr: string): string {
  if (!addr) return ''
  if (addr.length <= 13) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const ownerParam = req.query.owner
  const blobNameParam = req.query.blobName

  const owner = Array.isArray(ownerParam) ? ownerParam[0] : ownerParam
  const blobName = Array.isArray(blobNameParam)
    ? blobNameParam[0]
    : blobNameParam

  if (!owner || !blobName) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    return res.status(400).send('Missing owner or blobName')
  }

  const shortOwner = escapeHtml(shortAddress(owner))
  const safeOwner = encodeURIComponent(owner)
  const safeBlobName = encodeURIComponent(blobName)
  const videoUrl = `${RPC_BASE}/blobs/${safeOwner}/${safeBlobName}`
  const pageUrl = `${SITE_ORIGIN}/v/${safeOwner}/${safeBlobName}`
  const title = `Video by @${shortOwner} on Loop`
  const description = 'Watch on Loop. Videos that no one can take down.'

  const escapedTitle = escapeHtml(title)
  const escapedDesc = escapeHtml(description)
  const escapedVideo = escapeHtml(videoUrl)
  const escapedPage = escapeHtml(pageUrl)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapedTitle}</title>

  <meta property="og:title" content="${escapedTitle}" />
  <meta property="og:description" content="${escapedDesc}" />
  <meta property="og:type" content="video.other" />
  <meta property="og:url" content="${escapedPage}" />
  <meta property="og:image" content="${escapedVideo}" />
  <meta property="og:video" content="${escapedVideo}" />
  <meta property="og:video:secure_url" content="${escapedVideo}" />
  <meta property="og:video:type" content="video/mp4" />
  <meta property="og:video:width" content="1080" />
  <meta property="og:video:height" content="1920" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@0xmeto_" />
  <meta name="twitter:title" content="${escapedTitle}" />
  <meta name="twitter:description" content="${escapedDesc}" />
  <meta name="twitter:image" content="${escapedVideo}" />
</head>
<body>
  <p>Video by @${shortOwner}. <a href="${escapedPage}">Open on Loop</a></p>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  return res.status(200).send(html)
}
