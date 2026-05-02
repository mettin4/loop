import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import WalletProviders from './wallets/WalletProviders'
import { WalletModalProvider } from './wallets/WalletModalContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProviders>
      <WalletModalProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </WalletModalProvider>
    </WalletProviders>
  </StrictMode>,
)
