import { Network } from '@aptos-labs/ts-sdk'
import type { ShelbyNetwork } from '@shelby-protocol/sdk/browser'

export type ShelbyMode = 'shelbynet' | 'aptos-testnet'

export interface ShelbyNetworkConfig {
  mode: ShelbyMode
  network: ShelbyNetwork
  shelbyRpcBase: string
  aptosExplorerNetwork: string
  shelbyExplorerNetwork: string
  label: string
}

export const SHELBY_CONFIGS: Record<ShelbyMode, ShelbyNetworkConfig> = {
  'aptos-testnet': {
    mode: 'aptos-testnet',
    network: Network.TESTNET,
    shelbyRpcBase: 'https://api.testnet.shelby.xyz/shelby/v1',
    aptosExplorerNetwork: 'testnet',
    shelbyExplorerNetwork: 'testnet',
    label: 'Aptos Testnet',
  },
  shelbynet: {
    mode: 'shelbynet',
    network: Network.SHELBYNET,
    shelbyRpcBase: 'https://api.shelbynet.shelby.xyz/shelby/v1',
    aptosExplorerNetwork: 'shelbynet',
    shelbyExplorerNetwork: 'shelbynet',
    label: 'Shelbynet',
  },
}

function resolveMode(): ShelbyMode {
  const raw = (import.meta.env.VITE_SHELBY_MODE as string | undefined)?.trim()
  if (raw === 'shelbynet' || raw === 'aptos-testnet') return raw
  return 'aptos-testnet'
}

export const SHELBY_MODE: ShelbyMode = resolveMode()
export const SHELBY_CONFIG: ShelbyNetworkConfig = SHELBY_CONFIGS[SHELBY_MODE]

export function getConfigForMode(mode: ShelbyMode): ShelbyNetworkConfig {
  return SHELBY_CONFIGS[mode]
}
