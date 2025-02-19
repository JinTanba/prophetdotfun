"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useDisconnect } from "wagmi";
import { modal } from "@/context/WagmiProvider";
import { Wallet, LogOut } from "lucide-react";

interface WalletConnectButtonProps {
	onConnect: (address: string) => void;
}

export function WalletConnectButton({ onConnect }: WalletConnectButtonProps) {
	const [isConnecting, setIsConnecting] = useState(false);
	const { address, isConnected } = useAccount();
	const { disconnect } = useDisconnect();

	const handleConnect = async () => {
		try {
			setIsConnecting(true);
			await modal.open();
			if (address) {
				onConnect(address);
			}
		} catch (error) {
			console.error("Wallet connection error:", error);
		} finally {
			setIsConnecting(false);
		}
	};

	return (
		<Button
			onClick={isConnected ? () => disconnect() : handleConnect}
			disabled={isConnecting}
			variant={isConnected ? "outline" : "default"}
			className="w-full gap-2"
		>
			{isConnecting ? (
				<>
					<span className="animate-spin">◌</span>
					Connecting...
				</>
			) : isConnected ? (
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
