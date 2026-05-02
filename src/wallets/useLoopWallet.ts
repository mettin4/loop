import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { useAccount, useDisconnect } from 'wagmi'

export type Ecosystem = 'aptos' | 'ethereum' | 'solana'

export interface EcosystemState {
  connected: boolean
  address: string | null
  disconnect: () => void
}

export interface LoopWallet {
  aptos: EcosystemState
  ethereum: EcosystemState
  solana: EcosystemState
  isAnyConnected: boolean
  connectedCount: number
}

export function useLoopWallet(): LoopWallet {
  const aptos = useAptosWallet()
  const ethAccount = useAccount()
  const ethDisconnect = useDisconnect()
  const solana = useSolanaWallet()

  const aptosAddress = aptos.account?.address
    ? String(aptos.account.address)
    : null
  const ethAddress = ethAccount.address ?? null
  const solAddress = solana.publicKey ? solana.publicKey.toBase58() : null

  const aptosState: EcosystemState = {
    connected: aptos.connected,
    address: aptosAddress,
    disconnect: () => {
      try {
        const result = aptos.disconnect() as unknown
        if (result && typeof (result as Promise<unknown>).catch === 'function') {
          ;(result as Promise<unknown>).catch((err) => console.error(err))
        }
      } catch (err) {
        console.error(err)
      }
    },
  }

  const ethereumState: EcosystemState = {
    connected: ethAccount.isConnected,
    address: ethAddress,
    disconnect: () => {
      ethDisconnect.disconnect()
    },
  }

  const solanaState: EcosystemState = {
    connected: solana.connected,
    address: solAddress,
    disconnect: () => {
      solana.disconnect().catch((err) => console.error(err))
    },
  }

  const flags = [aptosState.connected, ethereumState.connected, solanaState.connected]
  const connectedCount = flags.filter(Boolean).length

  return {
    aptos: aptosState,
    ethereum: ethereumState,
    solana: solanaState,
    isAnyConnected: connectedCount > 0,
    connectedCount,
  }
}
