from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class PlayerBase(BaseModel):
    username: str

class PlayerCreate(PlayerBase):
    pass

class Player(PlayerBase):
    id: str
    total_points: int
    games_played: int
    created_at: datetime

    class Config:
        from_attributes = True

class GameRoundBase(BaseModel):
    player_choice: str
    opponent_choice: str
    player_points: int
    opponent_points: int
    round_number: int

class GameRound(GameRoundBase):
    id: str
    game_session_id: str
    played_at: datetime

    class Config:
        from_attributes = True

class GameSessionBase(BaseModel):
    player_id: str
    opponent_id: str
    points_earned: int
    rounds_played: int

class GameSession(GameSessionBase):
    id: str
    started_at: datetime
    ended_at: Optional[datetime]
    rounds: List[GameRound] = []

    class Config:
        from_attributes = True

class GameState(BaseModel):
    round_number: int
    total_rounds: int
    player_points: int
    opponent_points: int
    last_round: Optional[GameRound] = None
    is_active: bool 