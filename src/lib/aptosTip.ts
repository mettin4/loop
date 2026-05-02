import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk'

const config = new AptosConfig({ network: Network.TESTNET })
export const aptosClient = new Aptos(config)

export interface TipParams {
  recipientAddress: string
  amountApt: number
}

export interface TipResult {
  hash: string
  amount: number
  recipient: string
}

export const APT_TO_OCTA = 100_000_000

export function aptToOcta(apt: number): string {
  return Math.floor(apt * APT_TO_OCTA).toString()
}

export function buildTipPayload(params: TipParams) {
  return {
    function: '0x1::aptos_account::transfer' as const,
    functionArguments: [
      params.recipientAddress,
      aptToOcta(params.amountApt),
    ],
  }
}

export const APTOS_EXPLORER_URL = 'https://explorer.aptoslabs.com'

export function getExplorerTxUrl(hash: string): string {
  return `${APTOS_EXPLORER_URL}/txn/${hash}?network=testnet`
}
