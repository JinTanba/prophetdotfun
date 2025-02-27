"use client";
import { useAccount, useBalance } from "wagmi";
import { WalletConnectButton } from "./WalletConnectButton";
import { formatEther } from "viem";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Plus, Search, } from "lucide-react";
import { CreateProphetModal } from "./CreateProphetModal";
import { Button } from "@/components/ui/button";

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
			href: "#",
			icon: Plus,
			active: false,
			modal: true,
		},
		{
			name: "Verify Prophecy",
			href: "/redeem",
			icon: Search,
			active: pathname === "/redeem",
			modal: false,
		},
	];
	
	return (
		<header className="w-full bg-black backdrop-blur supports-[backdrop-filter]:bg-black/95 border-b border-gray-800 shadow-md">
			<div className="container mx-auto px-4 h-16 flex items-center justify-between">
				<div className="flex items-center gap-8">
					<Link
						href="/"
						className="text-2xl tracking-wide bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-300 transition-all duration-300 uppercase"
					>
						Prophet.fun
					</Link>
					<nav className="hidden sm:flex items-center gap-3">
						{navigation.map((item) => (
							item.modal ? (
								<CreateProphetModal
									key={item.name}
									trigger={
										<Button
											variant="ghost"
											className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
											${
												item.active
													? "bg-gray-900 text-white shadow-inner"
													: "text-gray-400 hover:bg-gray-900 hover:text-white"
											}`}
										>
											<item.icon className="w-4 h-4" />
											{item.name}
										</Button>
									}
								/>
							) : (
								<Link
									key={item.href}
									href={item.href}
									className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
									${
										item.active
											? "bg-gray-900 text-white shadow-inner"
											: "text-gray-400 hover:bg-gray-900 hover:text-white"
									}`}
								>
									<item.icon className="w-4 h-4" />
									{item.name}
								</Link>
							)
						))}
					</nav>
				</div>
				<div className="flex items-center gap-4">
					{isConnected && balance && (
						<div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-black border border-gray-800 shadow-inner">
							<Wallet className="w-4 h-4 text-gray-300" />
							<div className="flex flex-col items-end text-sm">
								<p className="text-gray-400 font-medium">
									{shortenAddress(address as string)}
								</p>
								<p className="text-gray-200 text-xs font-semibold">
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