import { useState } from "react";
import { Button } from "@/components/ui/button";

interface WalletConnectButtonProps {
	onConnect: (address: string) => void;
}

export function WalletConnectButton({ onConnect }: WalletConnectButtonProps) {
	const [isConnecting, setIsConnecting] = useState(false);

	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			// TODO: 実際のウォレット接続処理
			// デモ用に一時的なアドレスを返す
			const demoAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
			onConnect(demoAddress);
		} catch (error) {
			console.error("Wallet connection error:", error);
			alert("Wallet connection failed");
		} finally {
			setIsConnecting(false);
		}
	};

	return (
		<Button onClick={handleConnect} disabled={isConnecting} className="w-full">
			{isConnecting ? "Connecting..." : "Connect"}
		</Button>
	);
}
