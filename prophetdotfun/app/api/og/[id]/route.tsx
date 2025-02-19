import { ImageResponse } from "next/og";
import type { Prophet } from "@/types/prophet";

export const runtime = "edge";

// 画像のベースURLを設定

// 画像をBase64で埋め込む
const imageData = `data:image/png;base64,...`; // 実際のBase64エンコードされた画像データ

// コンポーネントを直接定義
function OGImage({ src, alt }: { src: string; alt: string }) {
	return (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={src}
			alt={alt}
			style={{
				width: "120px",
				height: "120px",
				borderRadius: "100%",
			}}
		/>
	);
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/api/prophet/${id}`
		);
		if (!response.ok) {
			return new Response(`Prophet not found`, { status: 404 });
		}
		const prophet: Prophet = await response.json();

		return new ImageResponse(
			(
				<div
					style={{
						height: "100%",
						width: "100%",
						display: "flex",
						flexDirection: "column",
						backgroundColor: "rgb(15, 23, 42)",
						color: "white",
						padding: "48px",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "32px",
						}}
					>
						{/* プロフィール部分 */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "24px",
							}}
						>
							<OGImage src={imageData} alt="" />
							<div
								style={{
									display: "flex",
									fontSize: 36,
									fontWeight: "bold",
								}}
							>
								{prophet.creator}
							</div>
						</div>

						{/* 予言内容 */}
						<div
							style={{
								display: "flex",
								fontSize: 48,
								fontWeight: "bold",
								lineHeight: 1.2,
							}}
						>
							{prophet.sentence}
						</div>

						{/* 賭け金額 */}
						<div
							style={{
								display: "flex",
								fontSize: 72,
								fontWeight: "bold",
								color: "rgb(34, 197, 94)",
							}}
						>
							${prophet.bettingAmount.toLocaleString()}
						</div>

						{/* フッター情報 */}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginTop: "auto",
							}}
						>
							<div
								style={{
									display: "flex",
									color: "rgb(148, 163, 184)",
									fontSize: 24,
								}}
							>
								Target Date{(prophet.targetDates ?? []).length > 1 ? "s" : ""}:{" "}
								{prophet.targetDates?.join(" ~ ") ?? prophet.targetDate}
							</div>
							<div
								style={{
									display: "flex",
									padding: "12px 24px",
									backgroundColor: "rgba(234, 179, 8, 0.2)",
									color: "rgb(234, 179, 8)",
									borderRadius: "9999px",
									fontSize: 24,
									fontWeight: "bold",
								}}
							>
								{prophet.status}
							</div>
						</div>
					</div>
				</div>
			),
			{
				width: 1200,
				height: 630,
			}
		);
	} catch (error) {
		console.error("Failed to generate OG image:", error);
		return new Response(`Failed to generate image`, { status: 500 });
	}
}
