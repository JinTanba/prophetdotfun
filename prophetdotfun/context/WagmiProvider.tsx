'use client'

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { moonbaseAlpha } from '@reown/appkit/networks'
import { cookieToInitialState, WagmiProvider as WagmiBaseProvider, type Config } from 'wagmi'

const queryClient = new QueryClient()

const metadata = {
	name: 'Prophet.fun',
	description: 'Prophecy Platform',
	url: 'https://prophet.fun',
	icons: ['https://prophet.fun/icon.png']
}

export const modal = createAppKit({
	adapters: [wagmiAdapter],
	projectId: projectId as string,
	networks: [moonbaseAlpha],
	defaultNetwork: moonbaseAlpha,
	metadata,
	features: {
		analytics: true
	}
})

export function WagmiProvider({ children, cookies }: { children: React.ReactNode; cookies?: string | null }) {
	const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

	return (
		<WagmiBaseProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		</WagmiBaseProvider>
	);
} 