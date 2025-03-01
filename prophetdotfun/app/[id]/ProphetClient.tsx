"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Prophet } from "@/types/prophet";
import Image from "next/image";

interface ProphetClientProps {
	prophet: Prophet;
}

function formatDateRange(dates: string[] | undefined) {
	if (!dates || dates.length === 0) {
		return "Not specified";
	}
	if (dates.length === 1) {
		return dates[0];
	}
	return `${dates[0]} 〜 ${dates[1]}`;
}

export default function ProphetClient({ prophet }: ProphetClientProps) {
	// バックエンドのレスポンスをフロントエンドの型に合わせて変換
	const displayProphet = {
		...prophet,
		text: prophet.text || prophet.sentence || "",
		bettingAmount: prophet.bettingAmount || prophet.betting_amount || 0,
		targetDate: prophet.targetDate || prophet.target_date || "",
	};

	return (
		<div className="container mx-auto max-w-2xl p-6">
			<Card className="bg-slate-900 text-white overflow-hidden">
				<CardContent className="p-12 space-y-8">
					{/* プロフィール部分 */}
					<div className="flex items-center gap-6">
						<div className="relative w-[120px] h-[120px]">
							<Image
								src="/image.png"
								alt=""
								fill
								className="rounded-full object-cover"
							/>
						</div>
						<div className="text-4xl font-bold">{displayProphet.creator}</div>
					</div>

					{/* 予言内容 */}
					<div className="text-5xl font-bold leading-tight">
						{displayProphet.text}
					</div>

					{/* 賭け金額 */}
					<div className="text-6xl font-bold text-green-500">
						${displayProphet.bettingAmount.toLocaleString()}
					</div>

					{/* フッター情報 */}
					<div className="flex justify-between items-center pt-4">
						<div className="text-slate-400 text-xl">
							Target Date
							{displayProphet.targetDates &&
							displayProphet.targetDates.length > 1
								? "s"
								: ""}
							: {formatDateRange(displayProphet.targetDates)}
						</div>
						<div className="px-6 py-3 bg-yellow-500/20 text-yellow-500 rounded-full text-xl font-bold">
							{displayProphet.status}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
