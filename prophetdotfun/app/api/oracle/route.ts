import { NextResponse } from 'next/server';

export type Oracle = {
  id: string;
  name: string;
  description: string;
};

const oracles: Oracle[] = [
  {
    id: 'BBC',
    name: 'BBC',
    description: 'British Broadcasting Corporation',
  },
  {
    id: 'AP',
    name: 'AP',
    description: 'Associated Press',
  },
  {
    id: 'COINDESK',
    name: 'CoinDesk',
    description: 'Crypto News Provider',
  },
];

export async function GET() {
  // 実際の環境では、データベースやキャッシュから取得する
  return NextResponse.json(oracles);
} 