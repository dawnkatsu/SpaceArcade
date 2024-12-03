/**
 * app.js
 * ------
 * Main Express/Socket.IO application for the Space Battle Multiplayer Game.
 * 
 * This file serves as the central server component, handling:
 * - HTTP server setup and static file serving
 * - WebSocket connections and real-time game communication
 * - Game session management and player matchmaking
 * - Game state synchronization between players
 * 
 * @module app
 * @requires express
 * @requires socket.io
 * @requires http
 * @requires path
 * @requires ./GameLogic
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

/**
 * Generates a unique game ID for new game sessions.
 * Creates a 4-character alphanumeric code that isn't currently in use.
 * 
 * @private
 * @returns {string} A unique 4-character game identifier
 */
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

// Socket.IO event handling setup
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Store session data in socket object
    socket.data = {
        username: null,
        gameId: null
    };

    /**
     * Sends initial connection confirmation to the client.
     * Provides the client with their unique player ID.
     * 
     * @event connection_established
     * @emits connection_established
     */
    socket.emit('connection_established', {
        message: 'Connected to server',
        player_id: socket.id
    });

    /**
     * Handles player disconnection.
     * Cleans up game state, notifies remaining players, and ends the game if necessary.
     * 
     * @event disconnect
     * @emits game_ended - If game ends due to player count dropping below 2
     * @emits game_state - If game continues with remaining players
     */
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

    /**
     * Creates a new game session.
     * Generates a unique game ID and initializes game state.
     * 
     * @event create_game
     * @param {string} username - The username of the player creating the game
     * @emits game_creation_error - If username is invalid
     * @emits game_created - If game creation is successful
     */
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

    /**
     * Handles a player joining an existing game.
     * Validates game ID and adds player if possible.
     * 
     * @event join_game
     * @param {Object} data - Join request data
     * @param {string} data.game_id - The ID of the game to join
     * @param {string} data.username - The username of the joining player
     * @emits join_error - If join request is invalid or game is full/not found
     * @emits game_joined - If join is successful
     * @emits player_joined - To notify existing players
     * @emits game_start - If this join completes the player count
     */
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

    /**
     * Handles game cancellation requests.
     * Removes the game and notifies all players.
     * 
     * @event cancel_game
     * @param {string} gameId - ID of the game to cancel
     * @emits game_cancelled - To notify all players in the game
     */
    socket.on('cancel_game', (gameId) => {
        if (games.has(gameId)) {
            games.delete(gameId);
            socket.leave(gameId);
            io.to(gameId).emit('game_cancelled');
            console.log(`Game cancelled: ${gameId}`);
        }
    });

    /**
     * Updates a player's vertical position.
     * 
     * @event player_move
     * @param {number} y - New vertical position
     */
    socket.on('player_move', (y) => {
        if (typeof y !== 'number') return;

        const gameId = socket.data.gameId;
        if (games.has(gameId)) {
            const posData = games.get(gameId).updatePlayerPosition(socket.id, y);
        }
    });

    /**
     * Handles player shooting action.
     * Broadcasts the shot to all players in the game.
     * 
     * @event player_shoot
     * @emits player_shoot - To notify all players of the shot
     */
    socket.on('player_shoot', (y) => {
        const gameId = socket.data.gameId;
        if (games.has(gameId)) {
            const data = games.get(gameId).playerShoot(socket.id);
            io.to(gameId).emit('player_shoot', {side: data.side, y: data.y})
        }
    });

    /**
     * Handles collision between a laser and a ship.
     * 
     * @event laser_ship_collision
     * @param {Object} data - Collision data
     */
    socket.on('laser_ship_collision', (data) => {
        const gameId = socket.data.gameId;
        if (games.has(gameId)) {
            games.get(gameId).handleLaserShipCollision(socket.id)
        }
    })

    /**
     * Handles collision between a laser and a meteor.
     * Broadcasts the collision to all players.
     * 
     * @event laser_meteor_collision
     * @param {Object} data - Collision data
     * @param {Object} data.laser - The laser object involved in collision
     * @param {Object} data.meteor - The meteor object involved in collision
     * @emits laser_meteor_collision - To notify all players of the collision
     */
    socket.on('laser_meteor_collision', (data) => {
        const gameId = socket.data.gameId;
        if (games.has(gameId)) {
            io.to(gameId).emit('laser_meteor_collision', 
                {
                laser: data.laser, 
                meteor: data.meteor});
        }
    });

    /**
     * Updates player score.
     * 
     * @event updateScore
     * @param {Object} data - Score update data
     * @param {string} data.side - Which player's score to update ('left' or 'right')
     * @param {number} data.change - Amount to change the score by
     */
    socket.on('updateScore', (data) => {
        const gameId = socket.data.gameId;
        if (games.has(gameId)) {
            games.get(gameId).updatePlayerScore(data.side, data.change / 2)
        }
    });

    /**
     * Handles meteor respawn requests.
     * Generates a new meteor and updates game state.
     * 
     * @event meteor_respawn
     * @param {string} meteorId - ID of the meteor to respawn
     * @emits game_state - Updated game state with new meteor
     */
    socket.on('meteor_respawn', (meteorId) => {
        const gameId = socket.data.gameId;
        if (games.has(gameId)) {
            const game = games.get(gameId);
            game.respawnMeteor(meteorId);
            // Broadcast new meteor positions to all players in the game
            io.to(gameId).emit('game_state', game.getState());
        }
    });

    /**
     * Handles collision between a meteor and a player ship.
     * Updates scores and broadcasts the new state.
     * 
     * @event meteor_collision
     * @param {Object} data - Collision data
     * @emits score_update - Updated scores after collision
     */
    socket.on('meteor_collision', (data) => {
        const gameId = socket.data.gameId;
        if (!gameId || !games.has(gameId)) return;

        const game = games.get(gameId);
        const result = game.handleMeteorCollision(socket.id, data);
        
        if (result.processed) {
            io.to(gameId).emit('score_update', {
                scoreP1: result.scoreP1,
                scoreP2: result.scoreP2
            });
        }
    });
});


/**
 * Initializes and runs the game loop for a specific game session.
 * Updates and broadcasts game state to all players at 60 FPS.
 * 
 * @private
 * @param {string} gameId - The unique identifier for the game session
 */
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