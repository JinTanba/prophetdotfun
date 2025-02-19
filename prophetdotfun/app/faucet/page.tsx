"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	useAccount,
	useWriteContract,
	useWaitForTransactionReceipt,
} from "wagmi";

// FaucetUSDCのABIを定義
const faucetUsdcAbi = [
	{
		name: "faucet",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [],
		outputs: [],
	},
] as const;

// デプロイされたFaucetUSDCのアドレス
const FAUCET_USDC_ADDRESS = "0xc81abd50155a19226baa37285fe53a0c3515285b";

export default function FaucetPage() {
	const { address } = useAccount();
	const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

	const { writeContract, isPending: isExecuting } = useWriteContract();

	const { isLoading: isFaucetPending, isSuccess: isFaucetSuccess } =
		useWaitForTransactionReceipt({
			hash: txHash,
		});

	const handleFaucetClick = async () => {
		if (!address) return;
		try {
			const hash = (await writeContract({
				address: FAUCET_USDC_ADDRESS as `0x${string}`,
				abi: faucetUsdcAbi,
				functionName: "faucet",
			})) as unknown as `0x${string}`;
			setTxHash(hash);
		} catch (err) {
			console.error("Failed to execute faucet:", err);
			alert("Failed to get test USDC");
		}
	};

	if (!address) {
		return (
			<div className="container mx-auto max-w-2xl p-6">
				<Card>
					<CardHeader>
						<CardTitle>Get Test USDC</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-center text-muted-foreground">
							Please connect your wallet to get test USDC
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-2xl p-6">
			<Card>
				<CardHeader>
					<CardTitle>Get Test USDC</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-4">
						<Button
							onClick={handleFaucetClick}
							disabled={!address || isExecuting || isFaucetPending}
							className="w-full mb-4"
						>
							{isExecuting
								? "Confirm in wallet..."
								: isFaucetPending
								? "Getting USDC..."
								: "Get Test USDC"}
						</Button>
						{(isExecuting || (isFaucetPending && txHash)) && (
							<p className="text-yellow-500 text-sm text-center animate-pulse">
								{isExecuting
									? "Please confirm the transaction in your wallet"
									: "Transaction pending..."}
							</p>
						)}
						{isFaucetSuccess && txHash && (
							<div className="text-green-500 text-sm text-center space-y-2">
								<p>Successfully received test USDC!</p>
								<a
									href={`https://moonbase.moonscan.io/tx/${txHash}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-500 hover:underline"
								>
									View transaction on Moonscan
								</a>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
