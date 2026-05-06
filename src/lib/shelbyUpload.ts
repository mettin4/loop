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

  try {
    await shelbyClient.rpc.putBlob({
      account: account.address,
      blobName,
      blobData: fileData,
    })
    blobUploaded = true
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('401') || message.includes('Unauthorized')) {
      uploadError =
        'Storage upload rejected by Shelby RPC (401). Check VITE_SHELBY_API_KEY.'
    } else if (
      message.includes('not been registered') ||
      message.includes('EBLOB_NOT_FOUND')
    ) {
      uploadError =
        'Blob registration TX did not propagate before upload. Try again.'
    } else {
      uploadError = message || 'Storage upload failed'
    }
    console.error('[shelby] putBlob failed:', err)
  }

  onProgress('complete')

  return {
    hash: tx.hash,
    blobName,
    blobUploaded,
    uploadError,
    ownerAddress: accountAddress.toString(),
    network: SHELBY_CONFIG.mode,
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
