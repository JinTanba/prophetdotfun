"use client";

import dynamic from 'next/dynamic';

// 3dmapコンポーネントをクライアントサイドでのみロードするように設定
const Map = dynamic(() => import('./3dmap').then(mod => ({ default: mod.Map })), {
  ssr: false, // サーバーサイドレンダリングを無効化
  loading: () => <div className="w-full h-96 flex items-center justify-center bg-gray-100">3Dマップを読み込み中...</div>
});

export function MapWrapper() {
  return (
    <div className="w-full">
      <Map />
    </div>
  );
}