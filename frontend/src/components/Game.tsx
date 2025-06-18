import { useState, useEffect, useRef } from 'react';
import { GameChoice, GameState, WebSocketMessage } from '../types/game';

interface GameProps {
  playerId: string;
  username: string;
}

export default function Game({ playerId, username }: GameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<GameChoice | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8000/ws/${playerId}`);

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        ws.send(JSON.stringify({
          type: 'join_game',
          username: username
        }));
        setIsWaiting(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        console.log('Received message:', event.data);
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred. Please make sure the backend server is running on http://localhost:8000');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event);
        if (!event.wasClean) {
          setError('Connection was lost. Please refresh the page to reconnect.');
        }
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [playerId, username]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('Processing message:', message);
    switch (message.type) {
      case 'game_start':
        setGameState({
          roundNumber: 1,
          totalRounds: message.total_rounds!,
          playerPoints: 0,
          opponentPoints: 0,
          isActive: true,
          opponentUsername: message.opponent,
          roundHistory: []
        });
        setIsWaiting(false);
        setSelectedChoice(null);
        break;

      case 'round_result':
        setGameState(prev => {
          if (!prev) return null;
          
          const newRound = {
            playerChoice: message.player_choice!,
            opponentChoice: message.opponent_choice!,
            playerPoints: message.points!,
            opponentPoints: message.opponent_points! - prev.opponentPoints,
            roundNumber: message.round_number!
          };
          
          return {
            ...prev,
            roundNumber: message.round_number!,
            playerPoints: message.total_points!,
            opponentPoints: message.opponent_points!,
            lastRound: newRound,
            roundHistory: [newRound, ...prev.roundHistory]
          };
        });
        setSelectedChoice(null);
        break;

      case 'game_end':
        setGameState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            isActive: false
          };
        });
        setSelectedChoice(null);
        break;

      case 'error':
        setError(message.message || 'An error occurred');
        break;

      case 'waiting':
        setIsWaiting(true);
        break;
    }
  };

  const makeChoice = (choice: GameChoice) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setSelectedChoice(choice);
      wsRef.current.send(JSON.stringify({
        type: 'make_choice',
        choice: choice
      }));
    } else {
      setError('Connection lost. Please refresh the page to reconnect.');
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        <p className="font-semibold">Error:</p>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="p-4 bg-blue-100 text-blue-700 rounded-lg">
        <p>Waiting for opponent...</p>
      </div>
    );
  }

  if (!gameState) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Reconnect
          </button>
        </div>
      )}

      {isWaiting && !gameState && (
        <div className="text-center p-4">
          <p className="mb-4">Waiting for another player to join...</p>
          <div className="animate-pulse bg-blue-100 p-4 rounded-lg inline-block">
            <span className="text-blue-800">Finding an opponent...</span>
          </div>
        </div>
      )}

      {gameState && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            {gameState.isActive && (
              <>
                <div className="flex items-center justify-center mb-4 p-4 bg-gray-100 rounded-lg whitespace-nowrap">
                  <span className="font-bold text-lg" style={{ color: '#2563EB' }}>{username}</span>
                  <span style={{ color: '#2563EB', marginLeft: '8px', marginRight: '40px' }}>({gameState.playerPoints})</span>
                  
                  <span className="text-lg font-medium" style={{ color: '#4B5563', marginLeft: '40px', marginRight: '40px' }}>vs</span>
                  
                  <span className="font-bold text-lg" style={{ color: '#DC2626', marginLeft: '40px' }}>{gameState.opponentUsername || 'Opponent'}</span>
                  <span style={{ color: '#DC2626', marginLeft: '8px' }}>({gameState.opponentPoints})</span>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-center">Round {gameState.roundNumber} of {gameState.totalRounds}</h2>
              </>
            )}
          </div>

          {gameState.isActive && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Make your choice:</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => makeChoice('cooperate')}
                  disabled={selectedChoice !== null}
                  style={{
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '0.5rem',
                    color: 'white',
                    backgroundColor: selectedChoice === 'cooperate' 
                      ? '#15803D' // dark green
                      : selectedChoice === 'defect'
                      ? '#22C55E' // lighter green with opacity
                      : '#22C55E', // normal green
                    opacity: selectedChoice === 'defect' ? 0.3 : 1,
                    cursor: selectedChoice !== null ? 'not-allowed' : 'pointer',
                    border: selectedChoice === 'cooperate' ? '2px solid #166534' : 'none'
                  }}
                >
                  Cooperate
                </button>
                <button
                  onClick={() => makeChoice('defect')}
                  disabled={selectedChoice !== null}
                  style={{
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '0.5rem',
                    color: 'white',
                    backgroundColor: selectedChoice === 'defect' 
                      ? '#B91C1C' // dark red
                      : selectedChoice === 'cooperate'
                      ? '#EF4444' // lighter red with opacity
                      : '#EF4444', // normal red
                    opacity: selectedChoice === 'cooperate' ? 0.3 : 1,
                    cursor: selectedChoice !== null ? 'not-allowed' : 'pointer',
                    border: selectedChoice === 'defect' ? '2px solid #991B1B' : 'none'
                  }}
                >
                  Defect
                </button>
              </div>
              {selectedChoice && (
                <p className="text-sm text-gray-600 text-center">
                  Waiting for {gameState.opponentUsername || 'opponent'}'s choice... (You chose to {selectedChoice})
                </p>
              )}
            </div>
          )}

          {!gameState.isActive && (
            <div className="mt-6 mb-6 p-4 bg-blue-100 rounded-lg text-center">
              <h3 className="font-semibold text-xl mb-2">Game Over!</h3>
              <p className="mb-4">Final Score:</p>
              <div className="flex justify-center space-x-8 mb-4">
                <div>
                  <span style={{ fontWeight: 'bold', color: '#2563EB' }}>{username}: </span>
                  <span className="text-xl font-bold">{gameState.playerPoints}</span>
                  <span className="text-sm text-gray-600"> (avg: {(gameState.playerPoints / gameState.totalRounds).toFixed(1)})</span>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#DC2626' }}>{gameState.opponentUsername || 'Opponent'}: </span>
                  <span className="text-xl font-bold">{gameState.opponentPoints}</span>
                  <span className="text-sm text-gray-600"> (avg: {(gameState.opponentPoints / gameState.totalRounds).toFixed(1)})</span>
                </div>
              </div>
              {gameState.playerPoints > gameState.opponentPoints ? (
                <p className="text-green-600 font-semibold">Congratulations! You won the game!</p>
              ) : gameState.playerPoints < gameState.opponentPoints ? (
                <p className="text-blue-600">Better luck next time! Keep trying different strategies!</p>
              ) : (
                <p className="text-purple-600">It's a tie! Great minds think alike!</p>
              )}
            </div>
          )}

          {gameState.roundHistory.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2 text-center">Round History:</h3>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <table style={{ 
                  borderCollapse: 'collapse',
                  margin: '0 auto',
                  width: 'auto',
                  maxWidth: '95%'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'left', minWidth: '80px' }}>Round</th>
                      <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'left', minWidth: '120px' }}>
                        <span style={{ color: '#2563EB' }}>{username}</span>
                      </th>
                      <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'left', minWidth: '120px' }}>
                        <span style={{ color: '#DC2626' }}>{gameState.opponentUsername || 'Opponent'}</span>
                      </th>
                      <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', minWidth: '100px' }}>Your Points</th>
                      <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', minWidth: '100px' }}>Opponent Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameState.roundHistory.map((round, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white' }}>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px' }}>{round.roundNumber - 1}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px' }}>
                          <span style={{ color: round.playerChoice === 'cooperate' ? '#16a34a' : '#dc2626' }}>
                            {round.playerChoice}
                          </span>
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px' }}>
                          <span style={{ color: round.opponentChoice === 'cooperate' ? '#16a34a' : '#dc2626' }}>
                            {round.opponentChoice}
                          </span>
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>+{round.playerPoints}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>+{round.opponentPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 