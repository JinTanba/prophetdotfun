# Prophet Backend

FastAPIとSupabaseを使用したProphetアプリケーションのバックエンド

## 環境構築

1. 必要なパッケージのインストール:
```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. 環境変数の設定:
`.env`ファイルを作成し、以下の変数を設定:
```
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_KEY=[YOUR-SUPABASE-KEY]
```

## データベーススキーマ

Supabaseで以下のSQLを実行してスキーマを設定:

```sql
-- 既存の関数とテーブルを削除
DROP FUNCTION IF EXISTS match_prophecies(vector, float, int);
DROP TABLE IF EXISTS prophecy_vectors;
DROP TABLE IF EXISTS prophecies;

-- prophecies テーブル作成
CREATE TABLE prophecies (
    id TEXT PRIMARY KEY,
    sentence TEXT NOT NULL,
    betting_amount DECIMAL NOT NULL,
    oracle TEXT NOT NULL,
    target_dates TEXT[] NOT NULL,
    creator TEXT NOT NULL,  -- Ethereumアドレスを格納するのでTEXT型
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- prophecies のインデックス作成
CREATE INDEX idx_prophecies_creator ON prophecies(creator);
CREATE INDEX idx_prophecies_status ON prophecies(status);

-- ベクトルストア用のテーブル作成
CREATE TABLE prophecy_vectors (
    id SERIAL PRIMARY KEY,
    prophecy_id TEXT NOT NULL,
    text TEXT NOT NULL,
    embedding vector(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    FOREIGN KEY (prophecy_id) REFERENCES prophecies(id)
);

-- prophecy_vectors のインデックス作成
CREATE INDEX prophecy_vectors_embedding_idx ON prophecy_vectors
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 更新時のタイムスタンプを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prophecies_updated_at
    BEFORE UPDATE ON prophecies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 類似予言検索用の関数
CREATE OR REPLACE FUNCTION match_prophecies(
    query_embedding vector(1024),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    prophecy_id text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.prophecy_id,
        1 - (pv.embedding <=> query_embedding) as similarity
    FROM prophecy_vectors pv
    WHERE 1 - (pv.embedding <=> query_embedding) > match_threshold
    ORDER BY pv.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- RLSポリシーの設定
ALTER TABLE prophecies ENABLE ROW LEVEL SECURITY;
ALTER TABLE prophecy_vectors ENABLE ROW LEVEL SECURITY;

-- prophecies のポリシー
CREATE POLICY "Prophecies are viewable by everyone" ON prophecies
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create prophecies" ON prophecies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Creator can update own prophecies" ON prophecies
    FOR UPDATE USING (creator = current_user);  -- RLSポリシーも修正

-- prophecy_vectors のポリシー
CREATE POLICY "Prophecy vectors are viewable by everyone" ON prophecy_vectors
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create prophecy vectors" ON prophecy_vectors
    FOR INSERT WITH CHECK (true);
```

## API エンドポイント

### POST /prophecies
新しい予言を作成

リクエストボディ:
```typescript
{
    sentence: string;
    bettingAmount: number;
    oracle: string;
    targetDate?: string;
    targetDates?: string[];
    creator: string;
    roi: number;
    entryPrice: number;
    currentPrice: number;
    leverage: number;
    isShort: boolean;
    status: "PENDING" | "COMPLETED" | "FAILED";
    created_at: string;
}
```

### GET /prophecies/{prophecy_id}
指定されたIDの予言を取得

### GET /prophecies/similar/{prophecy_id}
指定された予言に類似した予言を検索

## 開発サーバーの起動

```bash
uvicorn main:app --reload
```

サーバーは http://localhost:8000 で起動します。
APIドキュメントは http://localhost:8000/docs で確認できます。 