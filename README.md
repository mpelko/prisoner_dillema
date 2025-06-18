# Prisoner's Dilemma Game

A web-based implementation of the classic Prisoner's Dilemma game where players can compete against each other in real-time.

## Features

- Real-time multiplayer gameplay
- Random player matching
- Dynamic game sessions with variable number of rounds
- Score tracking and statistics
- API support for AI agent integration

## Game Rules

- Players are randomly matched for a game session
- Each session consists of multiple rounds of Prisoner's Dilemma
- Scoring system:
  - Both cooperate: 5 points each
  - Both defect: 0 points each
  - One cooperates, one defects: 8 points for defector, 2 points for cooperator
- Goal: Maximize average points per game

## Project Structure

```
prisoner_dilemma/
├── backend/           # Python FastAPI backend
│   ├── app/          # Application code
│   ├── tests/        # Backend tests
│   └── requirements.txt
├── frontend/         # TypeScript React frontend
│   ├── src/         # Source code
│   ├── public/      # Static files
│   └── package.json
└── README.md
```

## Quick Start

1. Make sure you have Python 3.8+, Node.js, and `uv` installed
   ```bash
   # Install uv if you haven't already
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
2. Clone the repository
3. Make the run script executable:
   ```bash
   chmod +x run.sh
   ```
4. Run the application:
   ```bash
   ./run.sh
   ```
5. Open your browser to http://localhost:5173

## Manual Setup

### Backend Setup

1. Create a virtual environment using `uv`:
   ```bash
   cd backend
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   uv pip install -r requirements.txt
   ```

3. Run the backend:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Development

- Backend runs on http://localhost:8000
- Frontend runs on http://localhost:5173
- API documentation available at http://localhost:8000/docs

## Admin Dashboard

- The admin dashboard is available at `/admin` and provides real-time statistics about active games, waiting players, and connected players.
- Access the admin dashboard by navigating to `http://localhost:5173/admin` in your browser.

## License

MIT License 