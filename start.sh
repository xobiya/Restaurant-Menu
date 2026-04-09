#!/bin/bash

echo "Navigating to server directory..."
cd server

echo "Installing backend dependencies..."
npm install

echo "Starting backend server..."
npm run start
