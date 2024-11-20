/**
app.js
------
Main Express/Socket.IO application for the Space Battle Multiplayer Game.

This file sets up the Express server, handles WebSocket connections,
manages game creation and joining, and coordinates communication
between clients.
*/

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { GameState } = require('./GameLogic'); 

// Initialize Express and Socket.IO
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Get project root directory
const PROJECT_ROOT = path.dirname(__dirname);

// Game state management
const games = new Map();

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'client', 'index.html'));
});

app.get('/assets/:path(*)', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'assets', req.params.path));
});

app.get('/:path(*)', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'client', req.params.path));
});

// Helper function to generate game ID
function generateGameId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let gameId;
    do {
        gameId = Array(4).fill()
            .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
            .join('');
    } while (games.has(gameId));
    return gameId;
}

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Store session data in socket object
    socket.data = {
        username: null,
        gameId: null
    };

    // Send welcome message
    socket.emit('connection_established', {
        message: 'Connected to server',
        player_id: socket.id
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        const gameId = socket.data.gameId;

        if (gameId && games.has(gameId)) {
            const game = games.get(gameId);
            if (game.players.has(socket.id)) {
                socket.leave(gameId);
                game.players.delete(socket.id);

                // End game if less than 2 players
                if (game.players.size < 2) {
                    if (game.players.size === 1) {
                        const [remainingPlayer] = game.players.values();
                        io.to(gameId).emit('game_ended', {
                            reason: 'disconnection',
                            winner: remainingPlayer.username
                        });
                    }
                    games.delete(gameId);
                } else {
                    // Update game state if game is still ongoing
                    game.handlePlayerDisconnect(socket.id);
                    io.to(gameId).emit('game_state', game.getState());
                }
            }
        }
    });

    socket.on('create_game', (username) => {
        if (typeof username !== 'string' || !username) {
            socket.emit('game_creation_error', {
                message: 'Invalid input: username must be a non-empty string'
            });
            return;
        }

        const gameId = generateGameId();
        games.set(gameId, new GameState());
        socket.join(gameId);
        games.get(gameId).addPlayer(socket.id, username);
        socket.data.gameId = gameId;
        socket.data.username = username;

        socket.emit('game_created', {
            game_id: gameId,
            username: username,
            player_side: 'left'
        });
        console.log(`Game created: ${gameId} by player: ${username}`);
    });

    socket.on('join_game', (data) => {
        if (!data || typeof data !== 'object' || !data.game_id || !data.username) {
            socket.emit('join_error', {
                message: 'Invalid input: expected a dictionary with game_id and username'
            });
            return;
        }

        const { game_id: gameId, username } = data;

        if (!games.has(gameId)) {
            socket.emit('join_error', { message: 'Game not found' });
            return;
        }

        const game = games.get(gameId);
        if (game.players.size >= 2) {
            socket.emit('join_error', { message: 'Game is full' });
            return;
        }

        socket.join(gameId);
        game.addPlayer(socket.id, username);
        socket.data.gameId = gameId;
        socket.data.username = username;

        socket.emit('game_joined', {
            game_id: gameId,
            username: username,
            player_side: 'right'
        });

        socket.to(gameId).emit('player_joined', { username: username });

        if (game.players.size === 2) {
            io.to(gameId).emit('game_start');
            startGameLoop(gameId);
        }

        console.log(`Player ${username} joined game: ${gameId}`);
    });

    socket.on('cancel_game', (gameId) => {
        if (games.has(gameId)) {
            games.delete(gameId);
            socket.leave(gameId);
            io.to(gameId).emit('game_cancelled');
            console.log(`Game cancelled: ${gameId}`);
        }
    });

    socket.on('player_move', (y) => {
        if (typeof y !== 'number') return;

        const gameId = socket.data.gameId;
        if (games.has(gameId)) {
            const posData = games.get(gameId).updatePlayerPosition(socket.id, y);
            // Note: Original code commented out emit here
        }
    });

    socket.on('player_shoot', () => {
        const gameId = socket.data.gameId;
        if (games.has(gameId)) {
            games.get(gameId).playerShoot(socket.id);
        }
    });

    socket.on('meteor_respawn', (meteorId) => {
        const gameId = socket.data.gameId;
        if (games.has(gameId)) {
            const game = games.get(gameId);
            game.respawnMeteor(meteorId);
            // Broadcast new meteor positions to all players in the game
            io.to(gameId).emit('game_state', game.getState());
        }
    });
});

// Game loop function
function startGameLoop(gameId) {
    const frameRate = 1000 / 60; // 60 FPS
    const gameInterval = setInterval(() => {
        if (!games.has(gameId) || games.get(gameId).players.size < 2) {
            clearInterval(gameInterval);
            return;
        }

        const data = games.get(gameId).getState();
        io.to(gameId).emit('game_state', data);
    }, frameRate);
}

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server starting... Access the game at http://localhost:${PORT}`);
    console.log(`Project root: ${PROJECT_ROOT}`);
});