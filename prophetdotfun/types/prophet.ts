export interface Prophet {
  id: string;
  sentence: string;
  bettingAmount: number;
  oracle: 'BBC' | 'AP' | 'CoinDesk';
  targetDate: Date;
  createdAt: Date;
  creator: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export type CreateProphetInput = {
	sentence: string;
	bettingAmount: number;
	oracle: string;
	targetDate: Date;
}; 