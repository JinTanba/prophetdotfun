from datetime import datetime, date
from typing import List
from pydantic import BaseModel, validator

class ProphecyCreate(BaseModel):
    id: str
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
        
        for date_str in v:
            try:
                datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                raise ValueError(f"Invalid date format: {date_str}. Use YYYY-MM-DD")
            
            if datetime.strptime(date_str, '%Y-%m-%d').date() < date.today():
                raise ValueError("Target date cannot be in the past")

        if len(v) == 2:
            start_date = datetime.strptime(v[0], '%Y-%m-%d')
            end_date = datetime.strptime(v[1], '%Y-%m-%d')
            if start_date > end_date:
                raise ValueError("End date must be after start date")

        return v

    @validator('oracle')
    def validate_oracle(cls, v):
        valid_oracles = ["BBC", "AP", "COINDESK"]
        if v not in valid_oracles:
            raise ValueError(f"Invalid oracle. Must be one of: {', '.join(valid_oracles)}")
        return v

class Prophecy(ProphecyCreate):
    pass 