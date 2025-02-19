"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import type { CreateProphetInput } from "@/types/prophet";
import type { Oracle } from "@/app/api/oracle/route";

export default function CreatePage() {
	const [walletAddress, setWalletAddress] = useState<string>("");
	const [oracles, setOracles] = useState<Oracle[]>([]);
	const [formData, setFormData] = useState<CreateProphetInput>({
		sentence: "",
		bettingAmount: 0,
		oracle: "",
		targetDate: new Date(),
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchOracles = async () => {
			try {
				const response = await fetch("/api/oracle");
				const data = await response.json();
				setOracles(data);
				// 最初のオラクルをデフォルト値として設定
				if (data.length > 0) {
					setFormData((prev) => ({
						...prev,
						oracle: data[0].id,
					}));
				}
			} catch (error) {
				console.error("オラクルの取得に失敗しました:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchOracles();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!walletAddress) {
			alert("ウォレットを接続してください");
			return;
		}

		try {
			// TODO: スマートコントラクトとの連携処理
			console.log("送信データ:", formData);
		} catch (error) {
			console.error("送信エラー:", error);
			alert("予言の作成に失敗しました");
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) =>
		setFormData({
			...formData,
			sentence: e.target.value.slice(0, 140),
		});

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) =>
		setFormData({
			...formData,
			bettingAmount: Number(e.target.value),
		});

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) =>
		setFormData({
			...formData,
			targetDate: new Date(e.target.value),
		});

	return (
		<div className="container mx-auto max-w-2xl p-6">
			<Card>
				<CardHeader>
					<CardTitle>予言を作成</CardTitle>
				</CardHeader>
				<CardContent>
					{!walletAddress && (
						<div className="mb-6">
							<WalletConnectButton onConnect={setWalletAddress} />
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="sentence">予言文 (140文字以内)</label>
							<Textarea
								id="sentence"
								value={formData.sentence}
								onChange={handleChange}
								rows={4}
								required
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="bettingAmount">賭け金額 (USDC)</label>
							<Input
								id="bettingAmount"
								type="number"
								value={formData.bettingAmount}
								onChange={handleNumberChange}
								required
							/>
						</div>

						<div className="space-y-2">
							<label>オラクル選択</label>
							{isLoading ? (
								<div>読み込み中...</div>
							) : (
								<Select
									value={formData.oracle}
									onValueChange={(value: string) =>
										setFormData({
											...formData,
											oracle: value as CreateProphetInput["oracle"],
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="オラクルを選択" />
									</SelectTrigger>
									<SelectContent>
										{oracles.map((oracle) => (
											<SelectItem key={oracle.id} value={oracle.id}>
												{oracle.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>

						<div className="space-y-2">
							<label htmlFor="targetDate">予言の対象日</label>
							<Input
								id="targetDate"
								type="date"
								value={formData.targetDate.toISOString().split("T")[0]}
								onChange={handleDateChange}
								required
							/>
						</div>

						<Button type="submit" className="w-full" disabled={!walletAddress}>
							予言を作成
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
