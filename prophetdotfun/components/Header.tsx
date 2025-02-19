"use client";

import { useAccount, useBalance } from "wagmi";
import { WalletConnectButton } from "./WalletConnectButton";
import { formatEther } from "viem";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Plus, Search } from "lucide-react";

export function Header() {
	const { address, isConnected } = useAccount();
	const { data: balance } = useBalance({
		address: address,
	});
	const pathname = usePathname();

	// アドレスを省略して表示する関数
	const shortenAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const navigation = [
		{
			name: "Create Prophecy",
			href: "/create",
			icon: Plus,
			active: pathname === "/create",
		},
		{
			name: "Verify Prophecy",
			href: "/redeem",
			icon: Search,
			active: pathname === "/redeem",
		},
	];

	return (
		<header className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4 h-16 flex items-center justify-between">
				<div className="flex items-center gap-8">
					<Link
						href="/"
						className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
					>
						Prophet.fun
					</Link>
					<nav className="hidden sm:flex items-center gap-2">
						{navigation.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors
                  ${
										item.active
											? "bg-secondary text-secondary-foreground"
											: "hover:bg-secondary/80"
									}`}
							>
								<item.icon className="w-4 h-4" />
								{item.name}
							</Link>
						))}
					</nav>
				</div>

				<div className="flex items-center gap-4">
					{isConnected && balance && (
						<div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-secondary">
							<Wallet className="w-4 h-4 text-secondary-foreground/70" />
							<div className="flex flex-col items-end text-sm">
								<p className="text-secondary-foreground/70 font-medium">
									{shortenAddress(address as string)}
								</p>
								<p className="text-secondary-foreground text-xs">
									{parseFloat(formatEther(balance.value)).toFixed(4)} ETH
								</p>
							</div>
						</div>
					)}
					<div className="w-40">
						<WalletConnectButton onConnect={() => {}} />
					</div>
				</div>
			</div>
		</header>
	);
}
