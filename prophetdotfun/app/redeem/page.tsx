"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnectButton } from '@/components/WalletConnectButton';

export default function RedeemPage() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [prophetCA, setProphetCA] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      alert('ウォレットを接続してください');
      return;
    }

    setIsRedeeming(true);
    try {
      // TODO: スマートコントラクトとの連携処理
      console.log('Redeem処理:', prophetCA);
    } catch (error) {
      console.error('Redeemエラー:', error);
      alert('Redeemに失敗しました');
    }
    setIsRedeeming(false);
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>予言をRedeem</CardTitle>
        </CardHeader>
        <CardContent>
          {!walletAddress && (
            <div className="mb-6">
              <WalletConnectButton onConnect={setWalletAddress} />
            </div>
          )}

          <form onSubmit={handleRedeem} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prophetCA">Prophet Contract Address</label>
              <Input
                id="prophetCA"
                value={prophetCA}
                onChange={(e) => setProphetCA(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={!walletAddress || isRedeeming}
            >
              {isRedeeming ? 'Redeem中...' : 'Redeem実行'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 