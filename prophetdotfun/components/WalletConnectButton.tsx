"use client";

import { Button } from "@/components/ui/button";

type Props = {
	onConnect: (address: string) => void;
};

export function WalletConnectButton({ onConnect }: Props) {
	const handleConnect = async () => {
		// TODO: 実際のウォレット接続処理を実装
		const mockAddress = "0x1234...5678";
		onConnect(mockAddress);
	};

	return (
		<Button onClick={handleConnect} variant="outline">
			ウォレットを接続
		</Button>
	);
} 