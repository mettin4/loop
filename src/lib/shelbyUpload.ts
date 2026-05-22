import {
  AccountAddress,
  Aptos,
  AptosConfig,
} from '@aptos-labs/ts-sdk'
import {
  ShelbyClient,
  generateCommitments,
  createDefaultErasureCodingProvider,
  ShelbyBlobClient,
  expectedTotalChunksets,
  getShelbyBlobExplorerUrl,
} from '@shelby-protocol/sdk/browser'
import { SHELBY_CONFIG, type ShelbyMode } from './shelbyNetwork'
import { generateThumbnailBlob } from './thumbnail'

const aptosConfig = new AptosConfig({ network: SHELBY_CONFIG.network })
export const shelbyAptosClient = new Aptos(aptosConfig)

const rawApiKey = import.meta.env.VITE_SHELBY_API_KEY as string | undefined
const shelbyApiKey =
  rawApiKey && rawApiKey.trim().length > 0 ? rawApiKey.trim() : undefined

export const shelbyClient = new ShelbyClient({
  network: SHELBY_CONFIG.network,
  ...(shelbyApiKey ? { apiKey: shelbyApiKey } : {}),
})

export type UploadStage =
  | 'preparing'
  | 'encoding'
  | 'registering'
  | 'uploading'
  | 'thumbnail'
  | 'complete'

export interface UploadParams {
  file: File
  caption: string
  account: { address: string }
  signAndSubmitTransaction(txn: { data: unknown }): Promise<{ hash: string }>
  onProgress: (stage: UploadStage) => void
}

export interface UploadResult {
  hash: string
  blobName: string
  blobUploaded: boolean
  uploadError?: string
  blobExplorerUrl?: string
  ownerAddress: string
  network: ShelbyMode
  thumbnailUrl?: string
}

function buildBlobMediaUrl(ownerAddress: string, blobName: string): string {
  const segments = blobName
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')
  return `${SHELBY_CONFIG.shelbyRpcBase}/blobs/${ownerAddress}/${segments}`
}

/**
 * Register and upload the poster image as its own Shelby blob. Best-effort:
 * any failure here is logged and swallowed so the video upload is unaffected.
 * Returns the thumbnail media URL on success, otherwise undefined.
 */
async function uploadThumbnailBlob(params: {
  file: File
  videoBlobName: string
  accountAddress: AccountAddress
  accountAddressString: string
  signAndSubmitTransaction: UploadParams['signAndSubmitTransaction']
  provider: Awaited<ReturnType<typeof createDefaultErasureCodingProvider>>
}): Promise<string | undefined> {
  const {
    file,
    videoBlobName,
    accountAddress,
    accountAddressString,
    signAndSubmitTransaction,
    provider,
  } = params

  try {
    const thumbBlob = await generateThumbnailBlob(file)
    const thumbData = new Uint8Array(await thumbBlob.arrayBuffer())
    const thumbBlobName = `${videoBlobName}.thumb.jpg`
    console.log('[shelby] thumbnail generated', {
      thumbBlobName,
      sizeBytes: thumbData.length,
    })

    const commitments = await generateCommitments(provider, thumbData)
    const expirationMicros = (Date.now() + 1000 * 60 * 60 * 24 * 365) * 1000

    const payload = ShelbyBlobClient.createRegisterBlobPayload({
      account: accountAddress,
      blobName: thumbBlobName,
      blobMerkleRoot: commitments.blob_merkle_root,
      numChunksets: expectedTotalChunksets(commitments.raw_data_size),
      expirationMicros,
      blobSize: commitments.raw_data_size,
      encoding: 0,
    })

    const tx = await signAndSubmitTransaction({ data: payload })
    await shelbyAptosClient.waitForTransaction({ transactionHash: tx.hash })

    await shelbyClient.rpc.putBlob({
      account: accountAddressString,
      blobName: thumbBlobName,
      blobData: thumbData,
    })

    console.log('[shelby] thumbnail uploaded', { thumbBlobName })
    return buildBlobMediaUrl(accountAddressString, thumbBlobName)
  } catch (err) {
    console.warn('[shelby] thumbnail upload skipped:', err)
    return undefined
  }
}

async function verifyBlobUploaded(
  ownerAddress: string,
  blobName: string,
): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 5000))
  const segments = blobName
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')
  const url = `${SHELBY_CONFIG.shelbyRpcBase}/blobs/${ownerAddress}/${segments}`
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch (err) {
    console.warn('[shelby] verifyBlobUploaded fetch failed:', err)
    return false
  }
}

function generateBlobName(caption: string): string {
  const slug = caption
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  const finalSlug = slug || 'video'
  return `${finalSlug}-${Date.now()}.mp4`
}

export async function uploadVideoToShelby(
  params: UploadParams,
): Promise<UploadResult> {
  const {
    file,
    caption,
    account,
    signAndSubmitTransaction,
    onProgress,
  } = params

  onProgress('preparing')
  const buffer = await file.arrayBuffer()
  const fileData = new Uint8Array(buffer)
  const blobName = generateBlobName(caption)

  onProgress('encoding')
  const provider = await createDefaultErasureCodingProvider()
  const commitments = await generateCommitments(provider, fileData)

  onProgress('registering')

  const expirationMicros =
    (Date.now() + 1000 * 60 * 60 * 24 * 365) * 1000

  const accountAddress = AccountAddress.from(account.address)

  const payload = ShelbyBlobClient.createRegisterBlobPayload({
    account: accountAddress,
    blobName,
    blobMerkleRoot: commitments.blob_merkle_root,
    numChunksets: expectedTotalChunksets(commitments.raw_data_size),
    expirationMicros,
    blobSize: commitments.raw_data_size,
    encoding: 0,
  })

  const tx = await signAndSubmitTransaction({ data: payload })
  await shelbyAptosClient.waitForTransaction({
    transactionHash: tx.hash,
  })

  onProgress('uploading')

  let blobUploaded = false
  let uploadError: string | undefined

  console.log('[shelby] putBlob start', {
    mode: SHELBY_CONFIG.mode,
    rpcBase: SHELBY_CONFIG.shelbyRpcBase,
    apiKeySet: !!shelbyApiKey,
    blobName,
    sizeBytes: fileData.length,
  })

  const UPLOAD_TIMEOUT_MS = 120_000
  const putBlobPromise = shelbyClient.rpc.putBlob({
    account: account.address,
    blobName,
    blobData: fileData,
  })
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error('UPLOAD_TIMEOUT')),
      UPLOAD_TIMEOUT_MS,
    )
  })

  try {
    await Promise.race([putBlobPromise, timeoutPromise])
    blobUploaded = true
    console.log('[shelby] putBlob success', { blobName })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[shelby] putBlob failed:', err)

    if (message.includes('UPLOAD_TIMEOUT')) {
      console.log('[shelby] verifying blob after timeout', { blobName })
      const verified = await verifyBlobUploaded(
        accountAddress.toString(),
        blobName,
      )
      if (verified) {
        console.log('[shelby] blob verified after timeout', { blobName })
        blobUploaded = true
      } else {
        uploadError = `Upload timeout after ${UPLOAD_TIMEOUT_MS / 1000}s. Blob not yet visible on Shelby RPC. Please retry.`
      }
    } else if (message.includes('401') || message.includes('Unauthorized')) {
      uploadError =
        'Storage upload rejected by Shelby RPC (401). Check VITE_SHELBY_API_KEY.'
    } else if (
      message.includes('not been registered') ||
      message.includes('EBLOB_NOT_FOUND')
    ) {
      uploadError =
        'Blob registration TX did not propagate before upload. Try again.'
    } else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      uploadError =
        'Network error reaching Shelby RPC. Check connection and retry.'
    } else {
      uploadError = message || 'Storage upload failed'
    }
  }

  let thumbnailUrl: string | undefined
  if (blobUploaded) {
    onProgress('thumbnail')
    thumbnailUrl = await uploadThumbnailBlob({
      file,
      videoBlobName: blobName,
      accountAddress,
      accountAddressString: account.address,
      signAndSubmitTransaction,
      provider,
    })
  }

  onProgress('complete')

  return {
    hash: tx.hash,
    blobName,
    blobUploaded,
    uploadError,
    ownerAddress: accountAddress.toString(),
    network: SHELBY_CONFIG.mode,
    thumbnailUrl,
    blobExplorerUrl: blobUploaded
      ? getShelbyBlobExplorerUrl(
          SHELBY_CONFIG.network,
          accountAddress.toString(),
          blobName,
        )
      : undefined,
  }
}

const APTOS_EXPLORER_URL = 'https://explorer.aptoslabs.com'

export function getShelbyExplorerUrl(hash: string): string {
  return `${APTOS_EXPLORER_URL}/txn/${hash}?network=${SHELBY_CONFIG.aptosExplorerNetwork}`
}
