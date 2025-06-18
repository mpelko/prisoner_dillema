from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, select
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Player(Base):
    __tablename__ = "players"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True, index=True)
    total_points = Column(Integer, default=0)
    games_played = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    game_sessions = relationship("GameSession", back_populates="player")

class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(String, primary_key=True)
    player_id = Column(String, ForeignKey("players.id"))
    opponent_id = Column(String, ForeignKey("players.id"))
    points_earned = Column(Integer, default=0)
    rounds_played = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    player = relationship("Player", back_populates="game_sessions")
    rounds = relationship("GameRound", back_populates="game_session")

class GameRound(Base):
    __tablename__ = "game_rounds"

    id = Column(String, primary_key=True)
    game_session_id = Column(String, ForeignKey("game_sessions.id"))
    player_choice = Column(String)  # "cooperate" or "defect"
    opponent_choice = Column(String)
    player_points = Column(Integer)
    opponent_points = Column(Integer)
    round_number = Column(Integer)
    played_at = Column(DateTime, default=datetime.utcnow)

    game_session = relationship("GameSession", back_populates="rounds")

# Database operations
async def get_players(db):
    result = await db.execute(select(Player))
    return result.scalars().all()

async def get_player(db, player_id: str):
    result = await db.execute(select(Player).where(Player.id == player_id))
    return result.scalar_one_or_none()

async def get_leaderboard(db):
    result = await db.execute(
        select(Player)
        .order_by(Player.total_points.desc())
        .limit(10)
    )
    return result.scalars().all() 