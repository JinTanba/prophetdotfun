'use client'

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, avalanche, base, optimism, polygon } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider as WagmiBaseProvider, type Config } from 'wagmi'

const queryClient = new QueryClient()

if (!projectId) {
	throw new Error('Project IDが設定されていません')
}

// 環境変数が未定義の場合のフォールバック値を設定
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const metadata = {
	name: 'Prophet.fun',
	description: 'Create and verify prophecies',
	url: appUrl,
	icons: ['https://prophet.fun/icon.png']
}

export const modal = createAppKit({
	adapters: [wagmiAdapter],
	projectId,
	networks: [mainnet, arbitrum, avalanche, base, optimism, polygon],
	defaultNetwork: mainnet,
	metadata,
	features: {
		analytics: true,
	},
})

export function WagmiProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
	const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

	return (
		<WagmiBaseProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</WagmiBaseProvider>
	)
} 