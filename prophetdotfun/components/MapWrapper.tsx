"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// 3dmapコンポーネントをクライアントサイドでのみロードするように設定
const Map = dynamic(() => import('./3dmap').then(mod => ({ default: mod.Map })), {
  ssr: false, // サーバーサイドレンダリングを無効化
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <div className="text-white text-xl font-bold">3Dマップを読み込み中...</div>
      </div>
    </div>
  )
});

export function MapWrapper() {
  const [isLoading, setIsLoading] = useState(true);

  // コンポーネントがマウントされた後、少し遅延してローディング状態を解除
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // 1.5秒後にローディングを解除

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-screen">
      {isLoading ? (
        <div className="w-full h-screen flex items-center justify-center bg-black">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-white text-xl font-bold">3Dマップを初期化中...</div>
          </div>
        </div>
      ) : (
        <Map />
      )}
    </div>
  );
}