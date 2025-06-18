from fastapi import WebSocket
from typing import Dict, Optional
import random
import uuid
import json
from datetime import datetime
import asyncio

from . import models, schemas
from sqlalchemy.orm import Session

class GameManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.waiting_players: Dict[str, str] = {}  # player_id -> username
        self.active_games: Dict[str, dict] = {}  # game_id -> game state

    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = websocket

    async def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]
        if player_id in self.waiting_players:
            del self.waiting_players[player_id]

    async def handle_message(self, player_id: str, message: dict):
        message_type = message.get("type")
        
        if message_type == "join_game":
            await self.handle_join_game(player_id, message.get("username"))
        elif message_type == "make_choice":
            await self.handle_player_choice(player_id, message.get("choice"))
        else:
            await self.send_error(player_id, "Invalid message type")

    async def handle_join_game(self, player_id: str, username: str):
        self.waiting_players[player_id] = username
        
        await self.send_message(player_id, {
            "type": "waiting",
            "message": "Waiting for opponent..."
        })

        await asyncio.sleep(5)

        if player_id in self.waiting_players:
            bot_id = f"bot_{uuid.uuid4()}"
            bot_name = f"Bot_{random.randint(1000, 9999)}"
            total_rounds = random.randint(5, 15)

            game_id = str(uuid.uuid4())
            game_state = {
                "round_number": 1,
                "total_rounds": total_rounds,
                "player_points": 0,
                "opponent_points": 0,
                "is_active": True,
                "players": {
                    player_id: username,
                    bot_id: bot_name
                },
                "bot_id": bot_id
            }

            self.active_games[game_id] = game_state
            del self.waiting_players[player_id]

            await self.send_game_start(game_id, player_id, bot_id)

            asyncio.create_task(self.bot_play(game_id, bot_id))

    async def handle_player_choice(self, player_id: str, choice: str):
        if choice not in ["cooperate", "defect"]:
            await self.send_error(player_id, "Invalid choice")
            return

        # Find the game this player is in
        game_id = None
        for gid, game in self.active_games.items():
            if player_id in game["players"]:
                game_id = gid
                break

        if not game_id:
            await self.send_error(player_id, "No active game found")
            return

        game = self.active_games[game_id]
        
        # Store the player's choice
        if "choices" not in game:
            game["choices"] = {}
        game["choices"][player_id] = choice

        # If both players have made their choice, process the round
        if len(game["choices"]) == 2:
            await self.process_round(game_id)

    async def process_round(self, game_id: str):
        game = self.active_games[game_id]
        choices = game["choices"]
        
        # Calculate points based on choices
        player1_id = list(game["players"].keys())[0]
        player2_id = list(game["players"].keys())[1]
        
        choice1 = choices[player1_id]
        choice2 = choices[player2_id]
        
        if choice1 == "cooperate" and choice2 == "cooperate":
            points1 = points2 = 5
        elif choice1 == "defect" and choice2 == "defect":
            points1 = points2 = 0
        elif choice1 == "cooperate" and choice2 == "defect":
            points1, points2 = 2, 8
        else:
            points1, points2 = 8, 2

        # Update game state
        game["player_points"] += points1
        game["opponent_points"] += points2
        game["round_number"] += 1
        
        # Send round results to both players
        await self.send_round_result(game_id, player1_id, choice1, choice2, points1, game["player_points"], game["opponent_points"])
        await self.send_round_result(game_id, player2_id, choice2, choice1, points2, game["opponent_points"], game["player_points"])
        
        # Clear choices for next round
        game["choices"] = {}
        
        # Check if game is over
        if game["round_number"] > game["total_rounds"]:
            await self.end_game(game_id)

    async def end_game(self, game_id: str):
        game = self.active_games[game_id]
        game["is_active"] = False
        
        # Send game end to both players
        for player_id in game["players"]:
            await self.send_message(player_id, {
                "type": "game_end",
                "game_id": game_id,
                "final_score": {
                    "player": game["player_points"] if player_id == list(game["players"].keys())[0] else game["opponent_points"],
                    "opponent": game["opponent_points"] if player_id == list(game["players"].keys())[0] else game["player_points"]
                }
            })
        
        # Clean up
        del self.active_games[game_id]

    async def send_message(self, player_id: str, message: dict):
        if player_id in self.active_connections:
            await self.active_connections[player_id].send_json(message)

    async def send_error(self, player_id: str, message: str):
        await self.send_message(player_id, {
            "type": "error",
            "message": message
        })

    async def send_game_start(self, game_id: str, player_id: str, opponent_id: str):
        game = self.active_games[game_id]
        await self.send_message(player_id, {
            "type": "game_start",
            "game_id": game_id,
            "opponent": game["players"][opponent_id],
            "total_rounds": game["total_rounds"]
        })

    async def send_round_result(self, game_id: str, player_id: str, 
                              player_choice: str, opponent_choice: str, points: int,
                              total_points: int, opponent_total_points: int):
        game = self.active_games[game_id]
        await self.send_message(player_id, {
            "type": "round_result",
            "game_id": game_id,
            "round_number": game["round_number"],
            "player_choice": player_choice,
            "opponent_choice": opponent_choice,
            "points": points,
            "total_points": total_points,
            "opponent_points": opponent_total_points
        })

    async def bot_play(self, game_id: str, bot_id: str):
        while game_id in self.active_games:
            await asyncio.sleep(random.randint(1, 5))
            choice = random.choice(["cooperate", "defect"])
            await self.handle_player_choice(bot_id, choice)

            await asyncio.sleep(0.1) 