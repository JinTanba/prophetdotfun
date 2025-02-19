from datetime import datetime
from typing import List
from pydantic import BaseModel

class ProphecyCreate(BaseModel):
    id: str
    sentence: str
    betting_amount: float
    oracle: str
    target_dates: List[datetime]  # 1つまたは2つの日付を含むリスト
    creator: str
    status: str = "PENDING"

class Prophecy(ProphecyCreate):
    pass 