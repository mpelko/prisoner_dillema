import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Game from './components/Game'
import Admin from './components/Admin'
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [isGameStarted, setIsGameStarted] = useState(false)

  const startGame = () => {
    if (username.trim()) {
      setPlayerId(Math.random().toString(36).substring(7))
      setIsGameStarted(true)
    }
  }

  return (
    <Router>
      <Routes>
        <Route path="/admin" element={
          <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto py-8">
              <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Prisoner's Dilemma</h1>
                <Link to="/" className="text-blue-500 hover:text-blue-700">
                  Back to Game
                </Link>
              </header>
              <Admin />
            </div>
          </div>
        } />
        
        <Route path="/" element={
          !isGameStarted ? (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h1 className="text-3xl font-bold text-center mb-8">Prisoner's Dilemma</h1>
                <div className="space-y-8">
                  <div>
                    <label htmlFor="username" className="block text-lg font-medium text-gray-700 mb-4 text-center">
                      Enter your username
                    </label>
                    <div className="py-6 px-4 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 text-center text-lg"
                        placeholder="Your username"
                      />
                    </div>
                  </div>
                  <button
                    onClick={startGame}
                    disabled={!username.trim()}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Start Game
                  </button>
                  <div className="text-center mt-4">
                    {/* Admin link removed */}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-screen bg-gray-100">
              <div className="container mx-auto py-8">
                <header className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold">Prisoner's Dilemma</h1>
                  <div className="space-x-4">
                    <button
                      onClick={() => setIsGameStarted(false)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      New Game
                    </button>
                  </div>
                </header>
                <Game playerId={playerId} username={username} />
              </div>
            </div>
          )
        } />
      </Routes>
    </Router>
  )
}

export default App
