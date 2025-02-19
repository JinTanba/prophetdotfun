from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
import uuid
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import logging
from vector_store import SupabaseVectorStore
from models import ProphecyCreate, Prophecy

# 環境変数の読み込み
load_dotenv()

# Supabaseクライアントの初期化
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")
supabase: Client = create_client(
    supabase_url=supabase_url,
    supabase_key=supabase_key
)

app = FastAPI()
vector_store = SupabaseVectorStore()

# CORSの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class Prophet(BaseModel):
    id: str
    sentence: str
    bettingAmount: float
    oracle: str
    targetDate: Optional[datetime] = None
    targetDates: Optional[List[datetime]] = None
    creator: str
    status: str = "PENDING"  # "PENDING" | "VERIFIED" | "FAILED"

class ProphecyCreate(BaseModel):
    id: str
    sentence: str
    betting_amount: float
    oracle: str
    target_dates: List[str]  # 複数の日付を受け取れるように変更
    creator: str
    status: str

@app.post("/prophecies")
async def create_prophecy(prophecy: ProphecyCreate):
    try:
        print("Received prophecy data:", prophecy.dict())
        
        # バリデーション
        if not prophecy.target_dates:
            raise HTTPException(status_code=422, detail="少なくとも1つの対象日付が必要です")
            
        # 日付形式の検証
        try:
            dates = [date.fromisoformat(date_str) for date_str in prophecy.target_dates]
            if len(dates) == 2 and dates[0] > dates[1]:
                raise HTTPException(status_code=422, detail="終了日は開始日より後である必要があります")
        except ValueError:
            raise HTTPException(status_code=422, detail="無効な日付形式です")

        # データベースに保存
        data = prophecy.dict()
        response = supabase.table("prophecies").insert(data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="保存に失敗しました")
            
        # ベクトルを保存
        await vector_store.store_vector(prophecy.id, prophecy.sentence)
        
        return response.data[0]
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print("Error creating prophecy:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prophecies/{prophecy_id}")
async def get_prophecy(prophecy_id: str):
    logger.debug(f"Fetching prophecy with ID: {prophecy_id}")
    try:
        result = supabase.table("prophecies").select("*").eq("id", prophecy_id).execute()
        
        if not result.data or len(result.data) == 0:
            logger.warning(f"Prophecy not found with ID: {prophecy_id}")
            raise HTTPException(status_code=404, detail="Prophecy not found")
            
        prophecy = result.data[0]
        logger.debug(f"Found prophecy: {prophecy}")
        return prophecy
    except Exception as e:
        logger.error(f"Error fetching prophecy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prophecies/{prophecy_id}/similar")
async def get_similar_prophecies(prophecy_id: str, limit: int = 5):
    try:
        # 元の予言を取得
        prophecy = supabase.table("prophecies").select("*").eq("id", prophecy_id).execute()
        if not prophecy.data:
            raise HTTPException(status_code=404, detail="Prophecy not found")
        
        # 類似予言を検索
        similar_results = vector_store.search_similar(prophecy.data[0]["sentence"], top_k=limit)
        
        # 類似予言のIDを使って予言データを取得
        similar_prophecies = []
        for text, score in similar_results:
            prophecy_data = supabase.table("prophecies").select("*").eq("sentence", text).execute()
            if prophecy_data.data:
                similar_prophecies.extend(prophecy_data.data)
        
        return similar_prophecies
    except Exception as e:
        logger.error(f"Error finding similar prophecies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 