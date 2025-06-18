#!/bin/bash

# Start the backend server
echo "Starting backend server..."
cd backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
echo "Starting uvicorn server..."
uvicorn app.main:app --reload --host 0.0.0.0 &

# Wait a moment for the backend to start
sleep 2

# Start the frontend server
echo "Starting frontend server..."
cd ../frontend
npm install
npm run dev &

# Wait for both processes
wait 