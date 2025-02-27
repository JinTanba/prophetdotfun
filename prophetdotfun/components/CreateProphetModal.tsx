"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CreateProphetInput } from "@/types/prophet";
import type { Oracle } from "@/app/api/oracle/route";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// 環境変数からアドレスを取得
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const PROPHET_ADDRESS = "0x4356ca92cf530690c1591411f488b1d908a60a42" as const;

// ABIの追加
const PROPHET_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_sentence", type: "string" },
      { internalType: "uint256", name: "_bettingAmount", type: "uint256" },
      { internalType: "string", name: "_oracle", type: "string" },
      { internalType: "uint256[]", name: "_targetDates", type: "uint256[]" },
    ],
    name: "createProphecy",
    outputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_stakeToken", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "stakeToken",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "sentence",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bettingAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "oracle",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "targetDates",
        type: "uint256[]",
      },
    ],
    name: "ProphecyCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "operator", type: "address" },
      { internalType: "bool", name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // エラー定義を更新
  {
    type: "error",
    name: "InvalidBettingAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidDate",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidOracle",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientAllowance",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidSentence",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidTargetDates",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferFailed",
    inputs: [],
  },
  // 0xe450d38cに対応するエラーを追加
  {
    type: "error",
    name: "OracleNotFound",
    inputs: [],
  },
  {
    type: "error",
    name: "ERC20InsufficientBalance",
    inputs: [
      { name: "account", type: "address" },
      { name: "balance", type: "uint256" },
      { name: "needed", type: "uint256" },
    ],
  },
] as const;

// USDCのABIを完全なものに更新
const USDC_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ProphecyCreatedイベントのトピックを修正
const PROPHECY_CREATED_EVENT_TOPIC =
  "0x7c4c5d7e13a9fe0ee9dbc9c8a1520b9c67c22749e9a09e3f6c0e0b60b3a1640" as const;

interface CreateProphetModalProps {
  trigger: React.ReactNode;
  initialSentence?: string;
}

export function CreateProphetModal({ trigger, initialSentence = "" }: CreateProphetModalProps) {
  const { address } = useAccount();
  const router = useRouter();
  const [oracles, setOracles] = useState<Oracle[]>([]);
  const [isDateRange, setIsDateRange] = useState(false);
  const [formData, setFormData] = useState<CreateProphetInput>({
    sentence: initialSentence,
    bettingAmount: 0,
    oracle: "",
    targetDates: [new Date()],
  });
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string>("0");
  const [open, setOpen] = useState(false);

  // USDC残高を取得する関数
  const fetchUsdcBalance = async () => {
    if (!address || !publicClient) return;

    try {
      const balance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      // USDCは6桁なので、1_000_000で割る
      setUsdcBalance((Number(balance) / 1_000_000).toString());
    } catch (error) {
      console.error("Failed to fetch USDC balance:", error);
    }
  };

  useEffect(() => {
    if (open) {
      const fetchOracles = async () => {
        try {
          const response = await fetch("/api/oracle");
          const data = await response.json();
          setOracles(data);
          if (data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              oracle: data[0].id,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch oracles:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchOracles();
      fetchUsdcBalance();
    }
  }, [open, fetchUsdcBalance, address, publicClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !walletClient || !publicClient) {
      alert("ウォレットを接続してください");
      return;
    }

    // USDC残高のチェックを追加
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "balanceOf",
      args: [address],
    });

    if (balance === BigInt(0)) {
      setStatus(
        "USDC balance is 0. Please get USDC from the Faucet page first."
      );
      return;
    }

    // betting amount validation
    if (formData.bettingAmount <= 0) {
      setStatus("Betting amount must be greater than 0");
      return;
    }

    // Add validation
    if (formData.sentence.trim() === "") {
      setStatus("Please enter a prophecy");
      return;
    }

    if (formData.oracle.trim() === "") {
      setStatus("Please select an oracle");
      return;
    }

    if (formData.targetDates.length === 0) {
      setStatus("Please select a date");
      return;
    }

    // Verify dates are not in the past
    const now = new Date();
    if (formData.targetDates.some((date) => date < now)) {
      setStatus("Cannot select past dates");
      return;
    }

    try {
      setIsProcessing(true);
      setStatus("Approving USDC...");

      const usdcAmount = BigInt(Math.floor(formData.bettingAmount * 1_000_000));
      const dates = formData.targetDates.map((date) =>
        BigInt(Math.floor(date.getTime() / 1000))
      );

      // USDC残高を確認
      const balance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      console.log("USDC balance:", balance.toString());

      // 現在のallowanceを確認
      const currentAllowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "allowance",
        args: [address, PROPHET_ADDRESS],
      });
      console.log("Current allowance:", currentAllowance.toString());

      // まずUSDCコントラクトのapproveを呼び出し
      // 一度承認をリセット
      const resetTx = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [PROPHET_ADDRESS, BigInt(0)],
      });
      await publicClient.waitForTransactionReceipt({ hash: resetTx });

      const approveTx = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [PROPHET_ADDRESS, usdcAmount],
      });

      setStatus("Waiting for approval transaction...");
      const approveReceipt = await publicClient.waitForTransactionReceipt({
        hash: approveTx,
        confirmations: 1,
      });

      if (!approveReceipt.status) {
        throw new Error("USDC approval failed");
      }

      // 承認が反映されるまで少し待つ
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 承認後のallowanceを確認
      const newAllowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "allowance",
        args: [address, PROPHET_ADDRESS],
      });
      console.log("New allowance:", newAllowance.toString());
      console.log("Required amount:", usdcAmount.toString());

      // createProphecy実行前にシミュレーションを追加
      setStatus("Creating prophecy...");

      // シミュレーション実行
      const simulateResult = await publicClient.simulateContract({
        address: PROPHET_ADDRESS,
        abi: PROPHET_ABI,
        functionName: "createProphecy",
        args: [formData.sentence, usdcAmount, formData.oracle, dates],
        account: address,
      });

      // デバッグ情報の追加
      console.log("Simulation parameters:", {
        address: PROPHET_ADDRESS,
        sentence: formData.sentence,
        amount: usdcAmount.toString(),
        oracle: formData.oracle,
        dates: dates.map((d) => d.toString()),
      });
      console.log("Simulation result:", simulateResult);

      const tx = await walletClient.writeContract({
        address: PROPHET_ADDRESS,
        abi: PROPHET_ABI,
        functionName: "createProphecy",
        args: [formData.sentence, usdcAmount, formData.oracle, dates],
      });

      // エラー処理の改善
      setStatus("Waiting for transaction completion...");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
        timeout: 60_000, // タイムアウトを60秒に設定
      });

      if (receipt.status === "reverted") {
        // 失敗の詳細を取得
        const reason = await publicClient.getTransactionReceipt({
          hash: tx,
        });
        console.log("Transaction failed details:", reason);
        throw new Error(`Transaction failed: ${JSON.stringify(reason)}`);
      }

      // すべてのログをデバッグ出力
      console.log("Transaction receipt:", receipt);
      console.log("All logs:", receipt.logs);

      // ProphecyCreatedイベントを探す
      const log = receipt.logs.find((log) => {
        console.log("Checking log:", {
          address: log.address,
          topics: log.topics,
          data: log.data,
          expectedAddress: PROPHET_ADDRESS,
          expectedTopic: PROPHECY_CREATED_EVENT_TOPIC,
        });

        return (
          log.address.toLowerCase() === PROPHET_ADDRESS.toLowerCase() &&
          log.topics[0] === PROPHECY_CREATED_EVENT_TOPIC
        );
      });

      if (log) {
        const tokenId = log.topics[2];
        const tokenIdDecimal = parseInt(tokenId as `0x${string}`, 16);

        setStatus(`Prophecy created! Token ID: ${tokenIdDecimal}`);
        setIsProcessing(false);

        setTimeout(() => {
          setOpen(false);
          router.push(`/${tokenIdDecimal}`);
        }, 3000);
        return;
      }

      throw new Error(
        "予言は作成されましたが、トークンIDを取得できませんでした"
      );
    } catch (error) {
      console.error("Error creating prophecy:", error);
      let errorMessage = "Failed to create prophecy";

      if (error instanceof Error) {
        // ERC20InsufficientBalanceエラーの処理を追加
        if (error.message.includes("0xe450d38c")) {
          const balance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: "balanceOf",
            args: [address],
          });

          errorMessage = `Insufficient USDC balance. Current balance: ${
            Number(balance) / 1_000_000
          } USDC`;

          // Faucetページへのリンクを追加
          setStatus(
            `${errorMessage} - To get USDC, please visit the Faucet page.`
          );
          return;
        }

        // 他のエラー処理
        if (error.message.includes("InvalidBettingAmount")) {
          errorMessage = "Invalid betting amount";
        } else if (error.message.includes("InvalidDate")) {
          errorMessage = "Invalid date";
        } else if (error.message.includes("InvalidOracle")) {
          errorMessage = "Invalid oracle";
        } else if (error.message.includes("InsufficientAllowance")) {
          errorMessage = "Insufficient USDC allowance";
        }
      }

      setStatus(errorMessage);
    } finally {
      if (!status.includes("Prophecy created!")) {
        setIsProcessing(false);
        setStatus("");
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) =>
    setFormData({
      ...formData,
      sentence: e.target.value.slice(0, 140),
    });

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({
      ...formData,
      bettingAmount: Number(e.target.value) || 0,
    });

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newDates = [...formData.targetDates];
    const newDate = new Date(e.target.value || new Date());

    // index === 0 は開始日、index === 1 は終了日
    if (index === 0) {
      // 開始日が変更された場合、終了日より後なら終了日を開始日に合わせる
      if (newDates[1] && newDate > newDates[1]) {
        newDates[1] = newDate;
      }
    } else if (index === 1) {
      // 終了日が変更された場合、開始日より前なら開始日に合わせる
      if (newDate < newDates[0]) {
        newDate.setTime(newDates[0].getTime());
      }
    }

    newDates[index] = newDate;
    setFormData({
      ...formData,
      targetDates: newDates,
    });
  };

  // 日付入力フィールドの最小値を設定
  const getMinDate = (index: number): string => {
    if (index === 0) {
      // 開始日は今日以降
      return new Date().toISOString().split("T")[0];
    } else {
      // 終了日は開始日以降
      return formData.targetDates[0].toISOString().split("T")[0];
    }
  };

  // isDateRangeが変更された時のハンドラー
  const handleDateRangeChange = (checked: boolean) => {
    setIsDateRange(checked);
    if (checked) {
      // 期間指定に変更された場合、終了日を開始日と同じに設定
      setFormData((prev) => ({
        ...prev,
        targetDates: [prev.targetDates[0], prev.targetDates[0]],
      }));
    } else {
      // 単一日付に変更された場合、配列を1つに
      setFormData((prev) => ({
        ...prev,
        targetDates: [prev.targetDates[0]],
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Prophecy</DialogTitle>
        </DialogHeader>
        
        {!address ? (
          <div className="p-4">
            <p className="text-center text-muted-foreground">
              Please connect your wallet to create prophecies
            </p>
          </div>
        ) : (
          <div className="py-4">
            <div className="mb-4 text-sm text-muted-foreground">
              USDC Balance: {usdcBalance} USDC
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="sentence">Prophecy (140 characters max)</label>
                <Textarea
                  id="sentence"
                  value={formData.sentence}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="bettingAmount">Betting Amount (USDC)</label>
                <Input
                  id="bettingAmount"
                  type="number"
                  value={formData.bettingAmount}
                  onChange={handleNumberChange}
                  min="0.000001"
                  step="0.000001"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  最小額: 0.000001 USDC
                </p>
              </div>

              <div className="space-y-2">
                <label>Select Oracle</label>
                {isLoading ? (
                  <div>Loading...</div>
                ) : (
                  <Select
                    value={formData.oracle}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        oracle: value as CreateProphetInput["oracle"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an oracle" />
                    </SelectTrigger>
                    <SelectContent>
                      {oracles.map((oracle) => (
                        <SelectItem key={oracle.id} value={oracle.id}>
                          {oracle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="date-range"
                    checked={isDateRange}
                    onCheckedChange={handleDateRangeChange}
                  />
                  <Label htmlFor="date-range">Specify date range</Label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="targetDate">
                    {isDateRange ? "Target Period" : "Target Date"}
                  </label>
                  <div className="space-y-2">
                    <Input
                      id="targetStartDate"
                      type="date"
                      value={formData.targetDates[0]?.toISOString().split("T")[0]}
                      onChange={(e) => handleDateChange(e, 0)}
                      min={getMinDate(0)}
                      required
                    />
                    {isDateRange && (
                      <>
                        <div className="text-center text-sm text-muted-foreground">
                          to
                        </div>
                        <Input
                          id="targetEndDate"
                          type="date"
                          value={
                            formData.targetDates[1]?.toISOString().split("T")[0]
                          }
                          onChange={(e) => handleDateChange(e, 1)}
                          min={getMinDate(1)}
                          required
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {status && (
                <div className="mt-4 p-4 bg-secondary rounded-lg">
                  <div className="flex items-center space-x-2">
                    {isProcessing && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                    <p>{status}</p>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Create Prophecy"}
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}