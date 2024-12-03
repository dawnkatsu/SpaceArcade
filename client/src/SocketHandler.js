/**
 * socket_handler.js
 * -----------------
 * Handles WebSocket communication between the client and server
 * for the Space Battle Multiplayer Game.
 * 
 * This file manages all socket events, including game creation,
 * joining, player actions, and game state updates.
 * 
 * Author: Una Lee
 * Date: 10/31/2024
 * Version: 1.0
 */

export class SocketHandler {
    /**
     * Initializes the SocketHandler.
     * Creates a new Socket.IO connection and sets up all necessary event listeners.
     * 
     * @constructor
     * @throws {Error} If Socket.IO connection fails to initialize
     */
    constructor() {
        this.socket = io();
        this.gameId = null;
        this.playerId = null;
        this.playerSide = null; 
        this.eventListeners = {};
        this.command = 0;
        this.command_prev = 0;
        this.setupSocketListeners();
    }

    /**
     * Sets up all socket event listeners.
     * Handles connection, game creation/joining, game state updates, and game end events.
     * 
     * @private
     */
    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('connection_established', (data) => {
            console.log('Connection established', data);
            this.playerId = data.player_id;
            this.triggerEvent('connectionEstablished', data);
        });

        this.socket.on('game_created', (data) => {
            console.log('Game created', data);
            this.gameId = data.game_id;
            this.playerSide = data.player_side;
            this.triggerEvent('gameCreated', data);
        });

        this.socket.on('game_joined', (data) => {
            console.log('Game joined', data);
            this.gameId = data.game_id;
            this.playerSide = data.player_side;
            this.triggerEvent('gameJoined', data);
        });

        this.socket.on('game_start', () => {
            console.log('Game started');
            this.triggerEvent('gameStart');
        });

        this.socket.on('game_state', (data) => {
            this.triggerEvent('gameStateUpdate', data);
        });

        this.socket.on('player_shoot', (data) => {
            this.triggerEvent('shootLaser', data);
        });

        this.socket.on('laser_meteor_collision', (data) => {
            this.triggerEvent('laser_meteor_collision', data);
        })

        this.socket.on('score_update', (data) => {
            this.triggerEvent('scoreUpdate', data);
        });

        this.socket.on('game_over', (data) => {
            console.log('Game over', data);
            this.triggerEvent('gameOver', data);
        });

        this.socket.on('game_ended', (data) => {
            console.log('Game ended', data);
            this.triggerEvent('gameEnded', data);
        });

        this.socket.on('game_creation_error', (data) => {
            console.error('Game creation error', data);
            this.triggerEvent('gameCreationError', data);
        });

        this.socket.on('join_error', (data) => {
            console.error('Join error', data);
            this.triggerEvent('joinError', data);
        });

    }

    /**
     * Creates a new game session on the server.
     * 
     * @param {string} username - The username of the player creating the game
     * @emits create_game
     */
    createGame(username) {
        this.socket.emit('create_game', username);
    }

    /**
     *  Sends a request to join an existing game session.
     * 
     * @param {string} gameId - The unique identifier of the game to join
     * @param {string} username - The username of the player joining the game
     * @emits join_game
     */
    joinGame(gameId, username) {
        this.socket.emit('join_game', { game_id: gameId, username: username });
    }

    /**
     * Updates the player's vertical position on the server.
     * 
     * @param {number} y - The new vertical position (pixels from top)
     * @emits player_move
     */
    sendPlayerMove(y) {
        this.socket.emit('player_move', y);
    }

    /**
     * Notifies the server that the player has fired their weapon.
     * 
     * @emits player_shoot
     */
    sendPlayerShoot() {
        this.socket.emit('player_shoot');
    }

    /**
     * Reports a collision between a laser and a meteor to the server.
     * 
     * @param {Object} laser - The laser object involved in the collision
     * @param {Object} meteor - The meteor object involved in the collision
     * @emits laser_meteor_collision
     */
    sendLaserMeteorCollision(laser, meteor) {
        this.socket.emit('laser_meteor_collision', {
            laser: laser,
            meteor: meteor
        })
    }

    /**
     * Updates the score for a specific player side.
     * 
     * @param {string} side - The side of the player ('left' or 'right')
     * @param {number} change - The score change amount (positive or negative)
     * @emits updateScore
     */
    updateScore(side, change) {
        this.socket.emit('updateScore', {side: side, change: change})
    }

    /**
     * Reports a collision between a laser and a player's ship.
     * 
     * @param {string} playerShip - The identifier of the ship that was hit
     * @emits laser_ship_collision
     */
    sendLaserShipCollision(playerShip) {
        this.socket.emit('laser_ship_collision', {
            player_ship: playerShip
        })
    }

    /**
     * Reports a collision between a meteor and a player's ship.
     * 
     * @param {string} meteorId - The unique identifier of the meteor
     * @param {string} playerShip - The identifier of the ship ('spaceship' or 'spaceship2')
     * @emits meteor_collision
     */

    sendMeteorCollision(meteorId, playerShip) {
        this.socket.emit('meteor_collision', {
            meteor_id: meteorId,
            player_ship: playerShip  // 'spaceship' or 'spaceship2'
        });
    }

    /**
     * Registers an event listener for a specific game event.
     * 
     * @param {string} event - The name of the event to listen for.
     * @param {function} callback - The function to call when the event occurs.
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /**
     * Removes an event listener for a specific game event.
     * 
     * @param {string} event - The name of the event to stop listening for
     * @param {Function} callback - The function to remove from the event listeners
     */
    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Triggers all registered callbacks for a specific event.
     * 
     * @private
     * @param {string} event - The name of the event to trigger.
     * @param {*} data - The data to pass to the event callbacks.
     */
    triggerEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Disconnects the socket from the server.
     */
    disconnect() {
        this.eventListeners = {};
        this.socket.disconnect();
    }
}

// Export a singleton instance
export default new SocketHandler();