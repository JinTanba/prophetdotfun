export interface Prophet {
	id: string;
	text: string;
	sentence?: string; // バックエンドとの互換性のため
	bettingAmount: number;
	betting_amount?: number; // バックエンドとの互換性のため
	oracle: string;
	targetDate?: string;
	target_date?: string; // バックエンドとの互換性のため
	targetDates: string[]; // 複数日付用
	creator: string;
	status: "PENDING" | "VERIFIED" | "FAILED";
}

export type CreateProphetInput = {
	sentence: string;
	bettingAmount: number;
	oracle: string;
	targetDates: Date[];
};
