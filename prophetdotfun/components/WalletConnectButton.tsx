"use client";

import { Button } from "@/components/ui/button";
import { useAccount, useDisconnect } from "wagmi";
import { modal } from "@/context/WagmiProvider";
import { Wallet, LogOut } from "lucide-react";

interface WalletConnectButtonProps {
	onConnect: (address: string) => void;
}

export function WalletConnectButton({ onConnect }: WalletConnectButtonProps) {
	const { address, isConnected } = useAccount();
	const { disconnect } = useDisconnect();

	const handleConnect = async () => {
		try {
			await modal.open();
			if (address) {
				onConnect(address);
			}
		} catch (error) {
			console.error("Wallet connection error:", error);
		}
	};

	return (
		<Button
			onClick={isConnected ? () => disconnect() : handleConnect}
			variant={isConnected ? "outline" : "default"}
			className="w-full gap-2"
		>
			{isConnected ? (
				<>
					<LogOut className="w-4 h-4" />
					Disconnect
				</>
			) : (
				<>
					<Wallet className="w-4 h-4" />
					Connect
				</>
			)}
		</Button>
	);
}
