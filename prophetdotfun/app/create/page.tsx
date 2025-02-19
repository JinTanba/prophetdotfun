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
import type { CreateProphetInput } from "@/types/prophet";
import type { Oracle } from "@/app/api/oracle/route";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// FastAPIのベースURLを設定
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CreatePage() {
	const { address } = useAccount();
	const pathname = usePathname();
	const router = useRouter();
	const [oracles, setOracles] = useState<Oracle[]>([]);
	const [isDateRange, setIsDateRange] = useState(false);
	const [formData, setFormData] = useState<CreateProphetInput>({
		sentence: "",
		bettingAmount: 0,
		oracle: "",
		targetDates: [new Date()],
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchOracles = async () => {
			try {
				const response = await fetch("/api/oracle");
				const data = await response.json();
				setOracles(data);
				if (data.length > 0) {
					setFormData((prev) => ({
						...prev,
						oracle: data[0].id,
					}));
				}
			} catch (error) {
				console.error("Failed to fetch oracles:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchOracles();
	}, []);

	useEffect(() => {
		const prophecyFromUrl = pathname?.split("/").pop();
		if (prophecyFromUrl && prophecyFromUrl !== "create") {
			setFormData((prev) => ({
				...prev,
				sentence: decodeURIComponent(prophecyFromUrl),
			}));
		}
	}, [pathname]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!address) {
			alert("ウォレットを接続してください");
			return;
		}

		try {
			setIsLoading(true);

			console.log("Target dates before formatting:", formData.targetDates);
			const formattedDates = formData.targetDates.map(
				(date) => date.toISOString().split("T")[0]
			);
			console.log("Formatted dates:", formattedDates);

			const requestData = {
				id: crypto.randomUUID(),
				sentence: formData.sentence,
				betting_amount: formData.bettingAmount,
				oracle: formData.oracle,
				target_dates: formattedDates,
				creator: address,
				status: "PENDING",
			};

			console.log("Sending request:", JSON.stringify(requestData, null, 2));

			const response = await fetch(`${apiBaseUrl}/prophecies`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestData),
			});

			const responseData = await response.json();

			if (!response.ok) {
				// エラーレスポンスの詳細をログに出力
				console.error("Server error response:", responseData);
				throw new Error(
					typeof responseData.detail === "string"
						? responseData.detail
						: "予言の作成に失敗しました"
				);
			}

			console.log("Created prophecy:", responseData);
			router.push(`/${responseData.id}`);
		} catch (error) {
			// エラーオブジェクトの詳細な情報を出力
			console.error("Submission error details:", {
				error,
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});

			alert(
				error instanceof Error ? error.message : "予言の作成に失敗しました"
			);
		} finally {
			setIsLoading(false);
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
			bettingAmount: Number(e.target.value) || 0,
		});

	const handleDateChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		index: number
	) => {
		const newDates = [...formData.targetDates];
		const newDate = new Date(e.target.value || new Date());

		// index === 0 は開始日、index === 1 は終了日
		if (index === 0) {
			// 開始日が変更された場合、終了日より後なら終了日を開始日に合わせる
			if (newDates[1] && newDate > newDates[1]) {
				newDates[1] = newDate;
			}
		} else if (index === 1) {
			// 終了日が変更された場合、開始日より前なら開始日に合わせる
			if (newDate < newDates[0]) {
				newDate.setTime(newDates[0].getTime());
			}
		}

		newDates[index] = newDate;
		setFormData({
			...formData,
			targetDates: newDates,
		});
	};

	// 日付入力フィールドの最小値を設定
	const getMinDate = (index: number): string => {
		if (index === 0) {
			// 開始日は今日以降
			return new Date().toISOString().split("T")[0];
		} else {
			// 終了日は開始日以降
			return formData.targetDates[0].toISOString().split("T")[0];
		}
	};

	// isDateRangeが変更された時のハンドラー
	const handleDateRangeChange = (checked: boolean) => {
		setIsDateRange(checked);
		if (checked) {
			// 期間指定に変更された場合、終了日を開始日と同じに設定
			setFormData((prev) => ({
				...prev,
				targetDates: [prev.targetDates[0], prev.targetDates[0]],
			}));
		} else {
			// 単一日付に変更された場合、配列を1つに
			setFormData((prev) => ({
				...prev,
				targetDates: [prev.targetDates[0]],
			}));
		}
	};

	if (!address) {
		return (
			<div className="container mx-auto max-w-2xl p-6">
				<Card>
					<CardHeader>
						<CardTitle>Create Prophecy</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-center text-muted-foreground">
							Please connect your wallet to create prophecies
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
					<CardTitle>Create Prophecy</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="sentence">Prophecy (140 characters max)</label>
							<Textarea
								id="sentence"
								value={formData.sentence}
								onChange={handleChange}
								rows={4}
								required
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="bettingAmount">Betting Amount (USDC)</label>
							<Input
								id="bettingAmount"
								type="number"
								value={formData.bettingAmount}
								onChange={handleNumberChange}
								required
							/>
						</div>

						<div className="space-y-2">
							<label>Select Oracle</label>
							{isLoading ? (
								<div>Loading...</div>
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
										<SelectValue placeholder="Select an oracle" />
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

						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<Switch
									id="date-range"
									checked={isDateRange}
									onCheckedChange={handleDateRangeChange}
								/>
								<Label htmlFor="date-range">期間を指定する</Label>
							</div>

							<div className="space-y-2">
								<label htmlFor="targetDate">
									{isDateRange ? "予言の対象期間" : "予言の対象日"}
								</label>
								<div className="space-y-2">
									<Input
										id="targetStartDate"
										type="date"
										value={formData.targetDates[0]?.toISOString().split("T")[0]}
										onChange={(e) => handleDateChange(e, 0)}
										min={getMinDate(0)}
										required
									/>
									{isDateRange && (
										<>
											<div className="text-center text-sm text-muted-foreground">
												から
											</div>
											<Input
												id="targetEndDate"
												type="date"
												value={
													formData.targetDates[1]?.toISOString().split("T")[0]
												}
												onChange={(e) => handleDateChange(e, 1)}
												min={getMinDate(1)}
												required
											/>
										</>
									)}
								</div>
							</div>
						</div>

						<Button type="submit" className="w-full">
							Create Prophecy
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
