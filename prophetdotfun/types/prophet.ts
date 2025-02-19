export type Prophet = {
	id: string;
	sentence: string;
	bettingAmount: number;
	oracle: string;
	targetDate?: string; // 単一の日付用（後方互換性のため）
	targetDates?: string[]; // 複数の日付用
	creator: string;
	roi: number;
	entryPrice: number;
	currentPrice: number;
	leverage: number;
	isShort: boolean;
	status: "PENDING" | "COMPLETED" | "FAILED";
};

export type CreateProphetInput = {
	sentence: string;
	bettingAmount: number;
	oracle: string;
	targetDate: Date;
};
