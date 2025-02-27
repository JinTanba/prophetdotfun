"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

// 環境変数からアドレスを取得
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

// USDC ABI
const USDC_ABI = [
	{
		inputs: [{ name: "account", type: "address" }],
		name: "balanceOf",
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "mint",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		name: "approve",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;

// FaucetUSDCのアドレスを追加
const FAUCET_USDC_ADDRESS =
	"0x17d8f09889cf7d5077a509330a7d3640c42db3fc" as const;

// FaucetUSDCのABIを定義
const FAUCET_ABI = [
	{
		inputs: [],
		name: "faucet",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;

export default function FaucetPage() {
	const { address } = useAccount();
	const publicClient = usePublicClient();
	const { data: walletClient } = useWalletClient();
	const [isLoading, setIsLoading] = useState(false);
	const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));

	// USDC残高を取得する関数
	const fetchUsdcBalance = async () => {
		if (!address || !publicClient) return;

		try {
			const balance = await publicClient.readContract({
				address: USDC_ADDRESS,
				abi: USDC_ABI,
				functionName: "balanceOf",
				args: [address],
			});
			setUsdcBalance(balance);
		} catch (error) {
			console.error("Failed to fetch USDC balance:", error);
		}
	};

	// アドレスまたはpublicClientが変更されたときに残高を更新
	useEffect(() => {
		fetchUsdcBalance();
	}, [address, publicClient, fetchUsdcBalance]);

	const handleMint = async () => {
		if (!address || !walletClient) {
			alert("ウォレットを接続してください");
			return;
		}

		try {
			setIsLoading(true);

			// FaucetUSDCコントラクトのfaucet関数を呼び出し
			const tx = await walletClient.writeContract({
				address: FAUCET_USDC_ADDRESS,
				abi: FAUCET_ABI,
				functionName: "faucet",
			});

			if (publicClient) {
				await publicClient.waitForTransactionReceipt({
					hash: tx,
				});
			}

			// トークン取得後に残高を更新
			await fetchUsdcBalance();
		} catch (error) {
			console.error("Error requesting tokens from faucet:", error);
			alert("Faucetからのトークン取得に失敗しました");
		} finally {
			setIsLoading(false);
		}
	};

	// USDC残高の表示を改善
	const formatUSDC = (amount: bigint) => {
		return (Number(amount) / 1_000_000).toFixed(2); // 小数点2桁まで表示
	};

	if (!address) {
		return (
			<div className="container mx-auto max-w-2xl p-6">
				<Card>
					<CardHeader>
						<CardTitle>USDC Faucet</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-center text-muted-foreground">
							Please connect your wallet to use the faucet
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container max-w-2xl py-8">
			<Card>
				<CardHeader>
					<CardTitle>USDC Faucet</CardTitle>
				</CardHeader>
				<CardContent>
					{/* USDC残高の表示を追加 */}
					<div className="mb-4 text-sm text-muted-foreground">
						USDC残高: {formatUSDC(usdcBalance)} USDC
					</div>

					<Button onClick={handleMint} disabled={isLoading} className="w-full">
						{isLoading ? "Processing..." : "Get USDC"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
