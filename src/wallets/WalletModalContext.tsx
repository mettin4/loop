import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import WalletModal from '../components/wallet/WalletModal'
import type { Ecosystem } from './useLoopWallet'

interface WalletModalApi {
  open: (opts?: { preselect?: Ecosystem }) => void
  close: () => void
  isOpen: boolean
}

const WalletModalContext = createContext<WalletModalApi | null>(null)

export function WalletModalProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false)
  const [preselect, setPreselect] = useState<Ecosystem | null>(null)

  const api = useMemo<WalletModalApi>(
    () => ({
      open: (opts) => {
        setPreselect(opts?.preselect ?? null)
        setIsOpen(true)
      },
      close: () => setIsOpen(false),
      isOpen,
    }),
    [isOpen],
  )

  return (
    <WalletModalContext.Provider value={api}>
      {children}
      <WalletModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        preselect={preselect}
      />
    </WalletModalContext.Provider>
  )
}

export function useWalletModal(): WalletModalApi {
  const ctx = useContext(WalletModalContext)
  if (!ctx) {
    throw new Error('useWalletModal must be used inside WalletModalProvider')
  }
  return ctx
}
