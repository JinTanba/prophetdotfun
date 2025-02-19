import type { Metadata } from "next";
import type { Prophet } from "@/types/prophet";

// baseUrlの設定
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getProphet(id: string): Promise<Prophet> {
	const url = new URL(`/api/prophet/${id}`, baseUrl);
	const response = await fetch(url.toString(), {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Failed to fetch prophet");
	}

	return response.json();
}

// Next.js 15の型定義に合わせて修正
export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	try {
		const { id } = await params;
		const prophet = await getProphet(id);
		const ogImageUrl = `${baseUrl}/api/og/${id}`;

		return {
			title: `Prophet - ${prophet.sentence}`,
			description: `Betting Amount: ${prophet.bettingAmount} USDC, ROI: ${prophet.roi}%`,
			openGraph: {
				title: `Prophet - ${prophet.sentence}`,
				description: `Betting Amount: ${prophet.bettingAmount} USDC, ROI: ${prophet.roi}%`,
				images: [ogImageUrl],
			},
			twitter: {
				card: "summary_large_image",
				title: `Prophet - ${prophet.sentence}`,
				description: `Betting Amount: ${prophet.bettingAmount} USDC, ROI: ${prophet.roi}%`,
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
