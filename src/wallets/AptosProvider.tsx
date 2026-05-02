import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react'
import type { PropsWithChildren } from 'react'

function AptosProvider({ children }: PropsWithChildren) {
  return (
    <AptosWalletAdapterProvider
      autoConnect
      onError={(error) => {
        console.error('[Aptos wallet]', error)
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  )
}

export default AptosProvider
