import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { moonbaseAlpha } from '@reown/appkit/networks'

// WalletConnectのプロジェクトIDを使用
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "4c042ac8298a664946937b18fc4d466a"

export const networks = [moonbaseAlpha]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig 