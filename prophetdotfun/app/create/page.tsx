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

export default function CreatePage() {
	const { address } = useAccount();
	const pathname = usePathname();
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
			alert("Please connect your wallet");
			return;
		}

		try {
			console.log("Submission data:", formData);
		} catch (error) {
			console.error("Submission error:", error);
			alert("Failed to create prophecy");
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

						<div className="space-y-2">
							<label htmlFor="targetDate">Target Date</label>
							<Input
								id="targetDate"
								type="date"
								value={formData.targetDate.toISOString().split("T")[0]}
								onChange={handleDateChange}
								required
							/>
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
