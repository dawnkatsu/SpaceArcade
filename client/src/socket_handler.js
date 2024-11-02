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

class SocketHandler {
    /**
     * Initializes the SocketHandler.
     * Sets up the socket connection and initializes event listeners.
     */
    constructor() {
        this.socket = io();
        this.gameId = null;
        this.playerId = null;
        this.eventListeners = {};

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
            this.triggerEvent('gameCreated', data);
        });

        this.socket.on('game_joined', (data) => {
            console.log('Game joined', data);
            this.gameId = data.game_id;
            this.triggerEvent('gameJoined', data);
        });

        this.socket.on('game_start', () => {
            console.log('Game started');
            this.triggerEvent('gameStart');
        });

        this.socket.on('game_state', (state) => {
            this.triggerEvent('gameStateUpdate', state);
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
        this.socket.disconnect();
    }
}

// Create a global instance of the SocketHandler
const socketHandler = new SocketHandler();