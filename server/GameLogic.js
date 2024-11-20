/**
 * game_logic.js
 * ------------
 * Game state management for the Space Battle Multiplayer Game.
 * 
 * This class handles player management, game state, and game actions.
 */

class GameState {
    constructor() {
        this.players = new Map(); // Using Map instead of object for better key-value management
        this.gameStarted = false;
    }

    addPlayer(playerId, username) {
        /**
         * Add a player to the game
         * @param {string} playerId - Unique identifier for the player
         * @param {string} username - Player's username
         * @returns {string} - The side assigned to the player ('left' or 'right')
         */
        const side = this.players.size === 0 ? 'left' : 'right';
        this.players.set(playerId, {
            username: username,
            side: side,
            position: 300  // Middle of screen (assuming 600 height)
        });
        return side;
    }

    removePlayer(playerId) {
        /**
         * Remove a player from the game
         * @param {string} playerId - Unique identifier for the player to remove
         */
        this.players.delete(playerId);
    }

    getPlayerSide(playerId) {
        /**
         * Gets player's side
         * @param {string} playerId - Unique identifier for the player
         * @returns {string} - The side ('left' or 'right') assigned to the player
         */
        return this.players.get(playerId).side;
    }

    getState() {
        /**
         * Get the current game state
         * @returns {Object} - Current positions of both players
         */
        let player1, player2;
        
        // Find players by their sides
        for (const [playerId, playerData] of this.players) {
            if (playerData.side === 'left') {
                player1 = playerId;
            }
            if (playerData.side === 'right') {
                player2 = playerId;
            }
        }

        return {
            player1: this.players.get(player1).position,
            player2: this.players.get(player2).position
        };
    }

    handlePlayerDisconnect(playerId) {
        /**
         * Handle a player disconnection
         * @param {string} playerId - Unique identifier for the disconnected player
         */
        this.removePlayer(playerId);
        this.gameStarted = false;
    }

    updatePlayerPosition(playerId, y) {
        /**
         * Update a player's position
         * @param {string} playerId - Unique identifier for the player
         * @param {number} y - New vertical position
         * @returns {Object} - Updated positions of both players
         */
        if (this.players.has(playerId)) {
            this.players.get(playerId).position = y;
        }

        // Find the other player
        let otherPlayerId;
        for (const [pid, _] of this.players) {
            if (pid !== playerId) {
                otherPlayerId = pid;
                break;
            }
        }

        return {
            player1: this.players.get(playerId).position,
            player2: this.players.get(otherPlayerId).position
        };
    }

    playerShoot(playerId) {
        /**
         * Handle player shoot action
         * @param {string} playerId - Unique identifier for the player who shot
         */
        // Placeholder for shooting mechanism
    }
}

module.exports = { GameState };