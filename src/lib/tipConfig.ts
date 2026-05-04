import type { Ecosystem } from '../wallets/useLoopWallet'

export type ChainCode = 'APT' | 'ETH' | 'SOL'

export interface TipConfig {
  chain: ChainCode
  ecosystem: Ecosystem
  symbol: string
  decimals: number
  presets: number[]
  minAmount: number
  usdRate: number
  recipient: string
  explorerName: string
  faucetUrl: string
  getExplorerTxUrl: (hash: string) => string
}

export const tipConfigs: Record<ChainCode, TipConfig> = {
  APT: {
    chain: 'APT',
    ecosystem: 'aptos',
    symbol: 'APT',
    decimals: 8,
    presets: [0.001, 0.01, 0.1],
    minAmount: 0.001,
    usdRate: 10,
    recipient:
      (import.meta.env.VITE_DEMO_TIP_RECIPIENT_APT as string | undefined) ?? '',
    explorerName: 'Aptos Explorer',
    faucetUrl: 'https://faucet.testnet.aptoslabs.com',
    getExplorerTxUrl: (hash) =>
      `https://explorer.aptoslabs.com/txn/${hash}?network=testnet`,
  },
  ETH: {
    chain: 'ETH',
    ecosystem: 'ethereum',
    symbol: 'ETH',
    decimals: 18,
    presets: [0.0001, 0.001, 0.01],
    minAmount: 0.0001,
    usdRate: 3500,
    recipient:
      (import.meta.env.VITE_DEMO_TIP_RECIPIENT_ETH as string | undefined) ?? '',
    explorerName: 'Sepolia Etherscan',
    faucetUrl: 'https://sepoliafaucet.com',
    getExplorerTxUrl: (hash) => `https://sepolia.etherscan.io/tx/${hash}`,
  },
  SOL: {
    chain: 'SOL',
    ecosystem: 'solana',
    symbol: 'SOL',
    decimals: 9,
    presets: [0.001, 0.01, 0.1],
    minAmount: 0.001,
    usdRate: 200,
    recipient:
      (import.meta.env.VITE_DEMO_TIP_RECIPIENT_SOL as string | undefined) ?? '',
    explorerName: 'Solana Explorer',
    faucetUrl: 'https://faucet.solana.com',
    getExplorerTxUrl: (hash) =>
      `https://explorer.solana.com/tx/${hash}?cluster=devnet`,
  },
}
