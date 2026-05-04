import { parseEther } from 'viem'
import type { Config } from 'wagmi'
import {
  sendTransaction,
  switchChain,
  waitForTransactionReceipt,
} from 'wagmi/actions'
import { sepolia } from 'wagmi/chains'

export interface EthTipParams {
  recipient: string
  amountEth: number
  config: Config
}

export interface EthTipResult {
  hash: string
}

export async function sendEthTip(
  params: EthTipParams,
): Promise<EthTipResult> {
  await switchChain(params.config, { chainId: sepolia.id })

  const hash = await sendTransaction(params.config, {
    to: params.recipient as `0x${string}`,
    value: parseEther(params.amountEth.toString()),
    chainId: sepolia.id,
  })

  await waitForTransactionReceipt(params.config, { hash })

  return { hash }
}
