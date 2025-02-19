"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Prophet } from "@/types/prophet";
import Image from "next/image";

interface ProphetClientProps {
	prophet: Prophet;
}

export default function ProphetClient({ prophet }: ProphetClientProps) {
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
						<div className="text-4xl font-bold">{prophet.creator}</div>
					</div>

					{/* 予言内容 */}
					<div className="text-5xl font-bold leading-tight">
						{prophet.sentence}
					</div>

					{/* 賭け金額 */}
					<div className="text-6xl font-bold text-green-500">
						${prophet.bettingAmount.toLocaleString()}
					</div>

					{/* フッター情報 */}
					<div className="flex justify-between items-center pt-4">
						<div className="text-slate-400 text-xl">
							Target Date
							{(prophet.targetDates ?? []).length > 1 ? "s" : ""}:{" "}
							{prophet.targetDates?.join(" ~ ") ?? prophet.targetDate}
						</div>
						<div className="px-6 py-3 bg-yellow-500/20 text-yellow-500 rounded-full text-xl font-bold">
							{prophet.status}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
