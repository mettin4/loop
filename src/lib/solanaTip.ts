import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import type { WalletContextState } from '@solana/wallet-adapter-react'

export interface SolTipParams {
  recipient: string
  amountSol: number
  wallet: WalletContextState
  connection: Connection
}

export interface SolTipResult {
  hash: string
}

export async function sendSolTip(
  params: SolTipParams,
): Promise<SolTipResult> {
  const { wallet, recipient, amountSol, connection } = params

  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error('Wallet not connected')
  }

  const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL)
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash()

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: new PublicKey(recipient),
      lamports,
    }),
  )
  transaction.recentBlockhash = blockhash
  transaction.feePayer = wallet.publicKey

  const hash = await wallet.sendTransaction(transaction, connection)
  await connection.confirmTransaction(
    { signature: hash, blockhash, lastValidBlockHeight },
    'confirmed',
  )

  return { hash }
}
