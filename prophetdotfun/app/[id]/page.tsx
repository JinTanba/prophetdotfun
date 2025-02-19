import { notFound } from "next/navigation";
import ProphetClient from "./ProphetClient";
import type { Prophet } from "@/types/prophet";

// baseUrlの設定
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getProphet(id: string): Promise<Prophet> {
	const url = new URL(`/prophecies/${id}`, baseUrl);
	console.log("Fetching prophet from:", url.toString());

	const response = await fetch(url.toString(), {
		cache: "no-store",
	});

	if (!response.ok) {
		const errorData = await response.json();
		console.error("Error response:", errorData);
		throw new Error(errorData.detail || "Failed to fetch prophet");
	}

	const data = await response.json();
	console.log("Received prophet data:", data);

	// snake_caseからcamelCaseに変換
	return {
		id: data.id,
		text: data.sentence,
		bettingAmount: data.betting_amount,
		oracle: data.oracle,
		targetDate: data.target_date,
		targetDates: data.target_dates,
		creator: data.creator,
		status: data.status,
	};
}

export default async function ProphetPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	try {
		const { id } = await params;
		const prophet = await getProphet(id);
		return <ProphetClient prophet={prophet} />;
	} catch (error) {
		console.error("Error fetching prophet:", error);
		notFound();
	}
}
