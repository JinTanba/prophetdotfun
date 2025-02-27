from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from datetime import datetime, date
from typing import Optional, List, Dict, Any
import uuid
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import logging
from vector_store import SupabaseVectorStore
from models import ProphecyCreate, Prophecy
from web3 import Web3
from eth_account import Account
import json
from prophet import Prophet
from prophet_metadata_dkg import create_knowledge

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

# Prophetインスタンスの初期化
prophet_instance = Prophet()

class Prophet(BaseModel):
    id: str
    sentence: str
    bettingAmount: float
    oracle: str
    targetDate: Optional[datetime] = None
    targetDates: Optional[List[datetime]] = None
    creator: str
    status: str = "PENDING"  # "PENDING" | "VERIFIED" | "FAILED"

class AddToDKGRequest(BaseModel):
    prophecy_id: str
    options: Optional[Dict[str, Any]] = None

class ProphecyCreate(BaseModel):
    sentence: str
    betting_amount: float
    oracle: str
    target_dates: List[str]
    creator: str
    status: str = "PENDING"
    tx_hash: str

    @validator('sentence')
    def validate_sentence(cls, v):
        if len(v) == 0:
            raise ValueError("Sentence cannot be empty")
        if len(v) > 140:
            raise ValueError("Sentence must be 140 characters or less")
        return v

    @validator('betting_amount')
    def validate_betting_amount(cls, v):
        if v <= 0:
            raise ValueError("Betting amount must be greater than 0")
        return v

    @validator('target_dates')
    def validate_target_dates(cls, v):
        if not v or len(v) == 0:
            raise ValueError("At least one target date is required")
        if len(v) > 2:
            raise ValueError("Maximum 2 target dates are allowed")
        
        # 日付形式の検証
        for date_str in v:
            try:
                datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                raise ValueError(f"Invalid date format: {date_str}. Use YYYY-MM-DD")
            
            # 過去の日付はNG
            if datetime.strptime(date_str, '%Y-%m-%d').date() < date.today():
                raise ValueError("Target date cannot be in the past")

        # 日付の順序を検証（2つの日付がある場合）
        if len(v) == 2:
            start_date = datetime.strptime(v[0], '%Y-%m-%d')
            end_date = datetime.strptime(v[1], '%Y-%m-%d')
            if start_date > end_date:
                raise ValueError("End date must be after start date")

        return v

    @validator('oracle')
    def validate_oracle(cls, v):
        valid_oracles = ["BBC", "AP", "COINDESK"]  # 有効なオラクルのリスト
        if v not in valid_oracles:
            raise ValueError(f"Invalid oracle. Must be one of: {', '.join(valid_oracles)}")
        return v

# Web3の設定
web3 = Web3(Web3.HTTPProvider(os.getenv("WEB3_PROVIDER_URL")))

# アドレスをチェックサムアドレスに変換
prophet_address = web3.to_checksum_address(os.getenv("PROPHET_CONTRACT_ADDRESS"))
usdc_address = web3.to_checksum_address(os.getenv("USDC_CONTRACT_ADDRESS"))

# コントラクトのインスタンス化
prophet_contract = web3.eth.contract(
    address=prophet_address,
    abi=json.loads(os.getenv("PROPHET_CONTRACT_ABI"))
)

@app.post("/prophecies")
async def create_prophecy(prophecy: ProphecyCreate):
    try:
        # Supabaseにデータを保存
        prophecy_data = {
            "id": prophecy.id,
            "sentence": prophecy.sentence,
            "betting_amount": prophecy.betting_amount,
            "oracle": prophecy.oracle,
            "target_dates": prophecy.target_dates,
            "creator": web3.to_checksum_address(prophecy.creator),  # creatorアドレスもチェックサム化
            "status": prophecy.status,
            "tx_hash": prophecy.tx_hash
        }
        
        result = supabase.table("prophecies").insert(prophecy_data).execute()
        
        # ベクトルDBへの保存
        await vector_store.store_vector(prophecy.id, prophecy.sentence)
        
        return {
            "status": "success",
            "id": prophecy.id
        }
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating prophecy: {str(e)}")
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

@app.post("/api/add-to-dkg")
async def add_to_dkg(request: AddToDKGRequest):
    """
    指定された予言をDKG（Distributed Knowledge Graph）に追加します。
    
    Args:
        request: AddToDKGRequest - 予言IDとオプションのDKGオプション
        
    Returns:
        UAL（Uniform Asset Locator）- DKGに追加されたアセットの識別子
        
    Raises:
        HTTPException: 予言が見つからない場合や、DKGへの追加に失敗した場合
    """
    try:
        logger.debug(f"Adding prophecy with ID {request.prophecy_id} to DKG")
        
        result = supabase.table("prophecies").select("*").eq("id", request.prophecy_id).execute()
        
        if not result.data or len(result.data) == 0:
            logger.warning(f"Prophecy not found with ID: {request.prophecy_id}")
            raise HTTPException(status_code=404, detail="Prophecy not found")
            
        prophecy = result.data[0]
        logger.debug(f"Found prophecy: {prophecy}")
        
        # 予言データを生成
        prophet_data = prophet_instance.generate_prophet_data(prophecy["sentence"])
        logger.debug(f"Generated prophet data with hash: {prophet_data['embededProphetHash']}")
        
        
        ual = create_knowledge(prophet_data, request.options)
        logger.info(f"Successfully added prophecy to DKG with UAL: {ual}")
        
        # 結果を返す
        return {
            "status": "success",
            "prophecy_id": request.prophecy_id,
            "ual": ual
        }
    except Exception as e:
        logger.error(f"Error adding prophecy to DKG: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)