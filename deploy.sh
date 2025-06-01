#!/bin/bash

# Stop any existing PM2 process
echo "Stopping existing PM2 process..."
pm2 stop gen-prompt || true
pm2 delete gen-prompt || true

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the application with PM2 with cluster mode
echo "Starting application with PM2 in cluster mode..."
pm2 start server.js --name "gen-prompt" --watch --instances max --exec-mode cluster --max-memory-restart 1G

# Save PM2 process list
echo "Saving PM2 process list..."
pm2 save

# Setup PM2 to start on system boot
echo "Setting up PM2 to start on system boot..."
pm2 startup

# Display status
echo "Deployment completed. PM2 Status:"
pm2 status

# Display logs
echo "Application logs:"
pm2 logs gen-prompt 