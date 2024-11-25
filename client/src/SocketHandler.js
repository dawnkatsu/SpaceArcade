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
     * Sets up the socket connection and initializes event listeners.
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
     * This method is called in the constructor and should not be called manually.
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
     * Sends a request to the server to create a new game.
     * @param {string} username - The username of the player creating the game.
     */
    createGame(username) {
        this.socket.emit('create_game', username);
    }

    /**
     * Sends a request to the server to join an existing game.
     * @param {string} gameId - The ID of the game to join.
     * @param {string} username - The username of the player joining the game.
     */
    joinGame(gameId, username) {
        this.socket.emit('join_game', { game_id: gameId, username: username });
    }

    /**
     * Sends the player's new vertical position to the server.
     * @param {number} y - The new vertical position of the player.
     */
    sendPlayerMove(y) {
        this.socket.emit('player_move', y);
    }

    /**
     * Sends a player shoot action to the server.
     */
    sendPlayerShoot() {
        this.socket.emit('player_shoot');
    }

    sendMeteorCollision(meteorId, playerShip) {
        this.socket.emit('meteor_collision', {
            meteor_id: meteorId,
            player_ship: playerShip  // 'spaceship' or 'spaceship2'
        });
    }

    /**
     * Registers an event listener for a specific game event.
     * @param {string} event - The name of the event to listen for.
     * @param {function} callback - The function to call when the event occurs.
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Triggers all registered callbacks for a specific event.
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