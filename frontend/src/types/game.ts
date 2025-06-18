export type GameChoice = "cooperate" | "defect";

export interface GameState {
  roundNumber: number;
  totalRounds: number;
  playerPoints: number;
  opponentPoints: number;
  lastRound?: GameRound;
  roundHistory: GameRound[];
  isActive: boolean;
  opponentUsername?: string;
}

export interface GameRound {
  playerChoice: GameChoice;
  opponentChoice: GameChoice;
  playerPoints: number;
  opponentPoints: number;
  roundNumber: number;
}

export interface WebSocketMessage {
  type: "game_start" | "round_result" | "game_end" | "error" | "waiting";
  game_id?: string;
  opponent?: string;
  total_rounds?: number;
  player_choice?: GameChoice;
  opponent_choice?: GameChoice;
  points?: number;
  total_points?: number;
  opponent_points?: number;
  round_number?: number;
  final_score?: {
    player: number;
    opponent: number;
  };
  message?: string;
} 