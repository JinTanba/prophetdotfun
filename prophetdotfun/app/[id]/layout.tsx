import type { Metadata } from "next";
import type { Prophet } from "@/types/prophet";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getProphet(id: string): Promise<Prophet> {
	const url = new URL(`/prophecies/${id}`, baseUrl);
	const response = await fetch(url.toString(), {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Failed to fetch prophet");
	}

	const data = await response.json();
	
	// バックエンドのレスポンスをフロントエンドの型に変換
	return {
		id: data.id,
		text: data.sentence,
		bettingAmount: data.betting_amount,
		oracle: data.oracle,
		targetDate: data.target_date,
		targetDates: data.target_dates,
		creator: data.creator,
		status: data.status
	};
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	try {
		const { id } = await params;
		const prophet = await getProphet(id);
		const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
		const ogImageUrl = `${appUrl}/api/og/${id}`;

		return {
			title: `Prophet - ${prophet.text}`,
			description: `Betting Amount: ${prophet.bettingAmount} USDC`,
			openGraph: {
				title: `Prophet - ${prophet.text}`,
				description: `Betting Amount: ${prophet.bettingAmount} USDC`,
				images: [ogImageUrl],
			},
			twitter: {
				card: "summary_large_image",
				title: `Prophet - ${prophet.text}`,
				description: `Betting Amount: ${prophet.bettingAmount} USDC`,
				images: [ogImageUrl],
			},
		};
	} catch {
		return {
			title: "Prophet",
			description: "Prophet not found",
		};
	}
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
