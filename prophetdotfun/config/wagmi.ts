import { cookieStorage, createStorage } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
export const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (!projectId) {
  throw new Error('WalletConnect Project ID is not defined')
}

if (!appUrl) {
  throw new Error('Application URL is not defined')
}

export const metadata = {
  name: 'Prophet.fun',
  description: 'Prophet.fun Web3 App',
  url: appUrl,
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const chains = [sepolia, mainnet]

export const wagmiConfig = {
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  chains,
  metadata
} 