from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
import json

from .database import engine, get_db
from . import models, schemas
from .game_manager import GameManager

app = FastAPI(title="Prisoner's Dilemma Game")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Game manager instance
game_manager = GameManager()

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Welcome to Prisoner's Dilemma Game API"}

@app.websocket("/ws/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    await game_manager.connect(websocket, player_id)
    try:
        while True:
            data = await websocket.receive_text()
            await game_manager.handle_message(player_id, json.loads(data))
    except WebSocketDisconnect:
        await game_manager.disconnect(player_id)

@app.get("/api/players", response_model=List[schemas.Player])
async def get_players(db: AsyncSession = Depends(get_db)):
    return await models.get_players(db)

@app.get("/api/players/{player_id}", response_model=schemas.Player)
async def get_player(player_id: str, db: AsyncSession = Depends(get_db)):
    return await models.get_player(db, player_id)

@app.get("/api/leaderboard", response_model=List[schemas.Player])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    return await models.get_leaderboard(db)

@app.get("/api/admin/stats", response_model=Dict)
async def get_admin_stats():
    """Get admin statistics including number of active games"""
    return {
        "active_games": len(game_manager.active_games),
        "waiting_players": len(game_manager.waiting_players),
        "connected_players": len(game_manager.active_connections)
    } 