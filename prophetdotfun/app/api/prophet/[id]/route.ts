import type { Prophet } from "@/types/prophet";

const mockProphets: Record<string, Prophet> = {
	"123e4567-e89b-12d3-a456-426614174000": {
		id: "123e4567-e89b-12d3-a456-426614174000",
		sentence:
			"The US government is operating a global surveillance program targeting civilians",
		bettingAmount: 1000,
		oracle: "WikiLeaks",
		targetDates: ["2025-03-21", "2025-05-21"],
		creator: "Edward Snowden",
		roi: 0,
		entryPrice: 1000,
		currentPrice: 1000,
		leverage: 1.0,
		isShort: false,
		status: "PENDING",
	},
	test: {
		id: "test",
		sentence: "Major tech companies will face antitrust regulations worldwide",
		bettingAmount: 500,
		oracle: "WikiLeaks",
		targetDate: "2025-05-21",
		creator: "Julian Assange",
		roi: 0,
		entryPrice: 500,
		currentPrice: 500,
		leverage: 1.0,
		isShort: false,
		status: "PENDING",
	},
};

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const prophet = mockProphets[id];

	if (!prophet) {
		return new Response(null, { status: 404 });
	}

	return Response.json(prophet);
}
