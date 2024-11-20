const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const GameLogic = require('./game_logic');

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Game rooms management
const games = new Map();

// Generate random game ID
function generateGameId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.emit('connection_established', {
        message: 'Connected to server',
        player_id: socket.id
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Find and cleanup any game this socket was in
        for (const [gameId, game] of games.entries()) {
            if (game.players.has(socket.id)) {
                game.removePlayer(socket.id);
                socket.leave(gameId);

                // If only one player remains, end the game
                if (game.players.size < 2) {
                    if (game.players.size === 1) {
                        const [remainingPlayerId, remainingPlayer] = 
                            Array.from(game.players.entries())[0];
                        io.to(gameId).emit('game_ended', {
                            reason: 'disconnection',
                            winner: remainingPlayer.username
                        });
                    }
                    games.delete(gameId);
                }
                break;
            }
        }
    });

    socket.on('create_game', (username) => {
        if (typeof username !== 'string' || !username) {
            socket.emit('game_creation_error', { message: 'Invalid username' });
            return;
        }

        const gameId = generateGameId();
        const game = new GameLogic();
        games.set(gameId, game);

        socket.join(gameId);
        game.addPlayer(socket.id, username);

        socket.emit('game_created', {
            game_id: gameId,
            username: username,
            player_side: 'left'
        });

        console.log(`Game created: ${gameId} by player: ${username}`);
    });

    socket.on('join_game', (data) => {
        if (!data || !data.game_id || !data.username) {
            socket.emit('join_error', { message: 'Invalid input data' });
            return;
        }

        const gameId = data.game_id;
        const game = games.get(gameId);

        if (!game) {
            socket.emit('join_error', { message: 'Game not found' });
            return;
        }

        if (game.players.size >= 2) {
            socket.emit('join_error', { message: 'Game is full' });
            return;
        }

        socket.join(gameId);
        game.addPlayer(socket.id, data.username);

        socket.emit('game_joined', {
            game_id: gameId,
            username: data.username,
            player_side: 'right'
        });

        // Notify other player
        socket.to(gameId).emit('player_joined', {
            username: data.username
        });

        // Start game if we now have two players
        if (game.players.size === 2) {
            io.to(gameId).emit('game_start');
            startGameLoop(gameId);
        }
    });

    socket.on('player_move', (moveType) => {
        // Find the game this socket is in
        for (const [gameId, game] of games.entries()) {
            if (game.players.has(socket.id)) {
                game.handlePlayerMove(socket.id, moveType);
                break;
            }
        }
    });

    socket.on('player_shoot', () => {
        // Find the game this socket is in
        for (const [gameId, game] of games.entries()) {
            if (game.players.has(socket.id)) {
                game.fireLaser(socket.id);
                break;
            }
        }
    });
});

function startGameLoop(gameId) {
    const game = games.get(gameId);
    if (!game) return;

    const FPS = 60;
    const interval = setInterval(() => {
        // Stop loop if game no longer exists
        if (!games.has(gameId)) {
            clearInterval(interval);
            return;
        }

        // Update game state
        game.update(1000/FPS); // delta time in milliseconds
        const state = game.getState();

        // Send state to all players
        io.to(gameId).emit('game_state', state);

        // Check for game end
        if (state.gameTime <= 0) {
            const endState = game.endGame();
            io.to(gameId).emit('game_ended', endState);
            games.delete(gameId);
            clearInterval(interval);
        }
    }, 1000/FPS);
}

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
    console.log(`Server starting... Access the game at http://localhost:${PORT}`);
});