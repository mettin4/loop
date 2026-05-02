import type { PropsWithChildren } from 'react'
import AptosProvider from './AptosProvider'
import EthereumProvider from './EthereumProvider'
import SolanaProvider from './SolanaProvider'

function WalletProviders({ children }: PropsWithChildren) {
  return (
    <AptosProvider>
      <EthereumProvider>
        <SolanaProvider>{children}</SolanaProvider>
      </EthereumProvider>
    </AptosProvider>
  )
}

export default WalletProviders
