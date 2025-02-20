try {
    setIsProcessing(true);
    setStatus("USDCの承認を行っています...");

    // USDC amount in smallest unit (6 decimals)
    const usdcAmount = BigInt(formData.bettingAmount * 1_000_000);

    // 1. USDCのapprove
    const approveTx = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [PROPHET_ADDRESS, usdcAmount],
    });

    setStatus("承認トランザクションの完了を待っています...");
    const approveReceipt = await publicClient!.waitForTransactionReceipt({
        hash: approveTx,
    });

    // Approveの成功を確認
    if (!approveReceipt.status) {
        throw new Error("USDC承認に失敗しました");
    }

    setStatus("予言を作成しています...");

    // デバッグ用にパラメータを出力
    console.log("CreateProphecy params:", {
        sentence: formData.sentence,
        amount: usdcAmount.toString(),
        oracle: formData.oracle,
        dates: formData.targetDates.map(date => 
            BigInt(Math.floor(date.getTime() / 1000)).toString()
        ),
    });

    // 2. createProphecy実行
    const dates = formData.targetDates.map((date) =>
        BigInt(Math.floor(date.getTime() / 1000))
    );

    const tx = await walletClient.writeContract({
        address: PROPHET_ADDRESS,
        abi: PROPHET_ABI,
        functionName: "createProphecy",
        args: [formData.sentence, usdcAmount, formData.oracle, dates],
    });

    setStatus("トランザクションの完了を待っています...");
    const receipt = await publicClient!.waitForTransactionReceipt({
        hash: tx,
    });

    // トランザクションの状態を確認
    if (receipt.status === "reverted") {
        // トランザクションの失敗理由を取得しようとする
        const reason = await publicClient!.simulateContract({
            address: PROPHET_ADDRESS,
            abi: PROPHET_ABI,
            functionName: "createProphecy",
            args: [formData.sentence, usdcAmount, formData.oracle, dates],
            account: address,
        }).catch(e => e.message);

        throw new Error(`トランザクションが失敗しました: ${reason}`);
    }

    // ... 残りのコード ...

} catch (error) {
    console.error("Error creating prophecy:", error);
    // エラーメッセージをより詳細に
    let errorMessage = "予言の作成に失敗しました";
    if (error instanceof Error) {
        errorMessage = error.message;
        // コントラクトのエラーメッセージから必要な部分を抽出
        const match = error.message.match(/execution reverted: (.*?)(?:\n|$)/);
        if (match) {
            errorMessage = match[1];
        }
    }
    setStatus(errorMessage);
} finally {
    // 成功時には実行されないように
    if (!status.includes("予言が作成されました")) {
        setIsProcessing(false);
        setStatus("");
    }
} 