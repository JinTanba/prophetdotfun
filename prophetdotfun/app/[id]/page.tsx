import { notFound } from "next/navigation";
import ProphetClient from "./ProphetClient";
import type { Prophet } from "@/types/prophet";

async function getProphet(id: string): Promise<Prophet> {
	const url = new URL(`/api/prophet/${id}`, process.env.NEXT_PUBLIC_API_URL);
	const response = await fetch(url, {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Failed to fetch prophet");
	}

	return response.json();
}

export default async function ProphetPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	try {
		const { id } = await params;
		const prophet = await getProphet(id);
		return <ProphetClient prophet={prophet} />;
	} catch (error) {
		console.error("Error fetching prophet:", error);
		notFound();
	}
}
