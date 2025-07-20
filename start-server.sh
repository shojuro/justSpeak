#!/bin/bash

echo "Starting JustSpeak Development Server..."
echo ""
echo "This terminal must remain open while testing."
echo "Press Ctrl+C to stop the server."
echo ""

cd "$(dirname "$0")"
npm run dev