#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Stopping..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo "Starting backend..."
cd "$SCRIPT_DIR/backend" && source .venv/bin/activate && uvicorn app.main:app --reload &
BACKEND_PID=$!

echo "Starting frontend..."
cd "$SCRIPT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both."

wait "$BACKEND_PID" "$FRONTEND_PID"
