import os
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client
from typing import List, Optional

class SupabaseVectorStore:
    def __init__(self):
        self.model = self._initialize_model()
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )

    def _initialize_model(self):
        """BGE Large モデルの初期化"""
        model_name = "BAAI/bge-large-en"
        print(f"Loading model: {model_name}")
        return SentenceTransformer(model_name)

    def embed_text(self, text: str) -> List[float]:
        """テキストをベクトルに変換"""
        try:
            embedding = self.model.encode([text], normalize_embeddings=True)
            return embedding[0].tolist()
        except Exception as e:
            print(f"Error during text embedding: {e}")
            return None

    async def store_vector(self, prophecy_id: str, text: str):
        """ベクトルとメタデータをSupabaseに保存"""
        try:
            embedding = self.embed_text(text)
            if embedding:
                data = {
                    "prophecy_id": prophecy_id,
                    "embedding": embedding,
                    "text": text
                }
                
                response = self.supabase.table("prophecy_vectors").insert(data).execute()
                print(f"Successfully stored vector for prophecy: {prophecy_id}")
                return response.data
        except Exception as e:
            print(f"Error storing vector in Supabase: {e}")
            raise e

    async def find_similar(self, text: str, limit: int = 5) -> List[str]:
        """類似予言の検索"""
        try:
            query_embedding = self.embed_text(text)
            if not query_embedding:
                return []

            response = self.supabase.rpc(
                'match_prophecies',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.7,
                    'match_count': limit
                }
            ).execute()

            return [item['prophecy_id'] for item in response.data]
        except Exception as e:
            print(f"Error during similarity search: {e}")
            return [] 