import { NextRequest, NextResponse } from "next/server";
import type { Prophet } from "@/types/prophet";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
	const id = request.nextUrl.pathname.split("/").pop();
	try {
		// URLの構築を明示的に行う
		const url = new URL(`/prophecies/${id}`, baseUrl);
		console.log("Fetching from:", url.toString()); // デバッグ用

		const response = await fetch(url.toString());

		if (!response.ok) {
			const error = await response.json();
			return NextResponse.json(error, { status: response.status });
		}

		const data = await response.json();

		// バックエンドのレスポンスをフロントエンドの型に変換
		const prophet: Prophet = {
			id: data.id,
			text: data.sentence,
			bettingAmount: data.betting_amount,
			oracle: data.oracle,
			targetDate: data.target_date,
			targetDates: data.target_dates,
			creator: data.creator,
			status: data.status,
		};

		return NextResponse.json(prophet);
	} catch (error) {
		console.error("Error fetching prophet:", error);
		return NextResponse.json(
			{ detail: "Failed to fetch prophet" },
			{ status: 500 }
		);
	}
}
