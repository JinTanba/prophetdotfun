"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccount } from 'wagmi';

export default function RedeemPage() {
  const { address } = useAccount();
  const [prophetCA, setProphetCA] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('Please connect your wallet');
      return;
    }

    setIsRedeeming(true);
    try {
      console.log('Redeeming:', prophetCA);
    } catch (error) {
      console.error('Redeem error:', error);
      alert('Failed to redeem');
    }
    setIsRedeeming(false);
  };

  if (!address) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Verify Prophecy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Please connect your wallet to verify prophecies
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Verify Prophecy</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRedeem} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prophetCA">Contract Address</label>
              <Input
                id="prophetCA"
                value={prophetCA}
                onChange={(e) => setProphetCA(e.target.value)}
                placeholder="Enter prophecy contract address"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isRedeeming}>
              {isRedeeming ? 'Verifying...' : 'Verify Prophecy'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 