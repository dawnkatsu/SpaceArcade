/**
 * game_logic.js
 * ------------
 * Game state management for the Space Battle Multiplayer Game.
 * 
 * This class handles player management, game state, and game actions.
 */

const { CURRENT_SETTINGS } = require('./settings');

class GameState {
    constructor() {
        this.players = new Map();
        this.gameStarted = false;
        this.meteors = [];
        this.processedMeteorCollisions = new Set();
        this.respawningPlayers = new Set(); // Track respawning players

        // Initialize meteors
        for (let i = 0; i < CURRENT_SETTINGS.num_asteroids; i++) {
            this.meteors.push(this.generateNewMeteor());
        }
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
            position: 300,  // Middle of screen (assuming 600 height)
            score: 0       // Initialize score to 0
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

    getPlayerScore(side) {
        for (const [_, player] of this.players) {
            if (player.side === side) {
                return player.score;  
            }
        }
        return 0;  // Only returns 0 if no player found with that side
    }

    updatePlayerScore(side, change) {
        for (const [_, player] of this.players) {
            if (player.side === side) {
                player.score = Math.max(0, player.score + change);
                return;
            }
        }
    }

    generateNewMeteor(isOutOfBounds = false) {
        let rand_y;
        if (!isOutOfBounds) {
            // Used when the meteors are initially generated
            rand_y = Math.random() * 600;
        } else {
            // Used when the meteors need respawning
            rand_y = 600 * Math.floor(Math.random() * 2);
            const ofst = 20;
            rand_y = rand_y === 0 ? rand_y - ofst : rand_y + ofst;
        }

        const rand_x = Math.random() * (CURRENT_SETTINGS.asteroids_x_coverage * 2) + (400 - CURRENT_SETTINGS.asteroids_x_coverage);
        const rand_vx = Math.random() * (CURRENT_SETTINGS.asteroids_x_vel_max - CURRENT_SETTINGS.asteroids_x_vel_min) + CURRENT_SETTINGS.asteroids_x_vel_min;
        const rand_vy = Math.random() * (CURRENT_SETTINGS.asteroids_y_vel_max - CURRENT_SETTINGS.asteroids_y_vel_min) + CURRENT_SETTINGS.asteroids_y_vel_min;
        const scale = Math.random() * (CURRENT_SETTINGS.asteroids_scale_max - CURRENT_SETTINGS.asteroids_scale_min) + CURRENT_SETTINGS.asteroids_scale_min;

        return {
            id: Math.random().toString(36).substr(2, 9), // Unique ID for tracking
            x: rand_x,
            y: rand_y,
            velocityX: rand_vx,
            velocityY: rand_vy,
            scale: scale,
            init_x_vel: rand_vx
        };
    }

    // Called when client reports a meteor is out of bounds
    respawnMeteor(meteorId) {
        this.processedMeteorCollisions.delete(meteorId);
        const index = this.meteors.findIndex(m => m.id === meteorId);
        if (index !== -1) {
            this.meteors[index] = this.generateNewMeteor(true);
        }
    }

    handleMeteorCollision(playerId, data) {
        if (this.processedMeteorCollisions.has(data.meteor_id)) {
            return {
                scoreP1: this.getPlayerScore('left'),
                scoreP2: this.getPlayerScore('right'),
                processed: false
            };
        }

        // Start respawn state for the hit player
        this.respawningPlayers.add(playerId);

        // Reset player position to middle
        if (this.players.has(playerId)) {
            this.players.get(playerId).position = 300; // Reset to middle of screen
        }
        
        // Set timeout to clear respawn state after delay
        setTimeout(() => {
            this.respawningPlayers.delete(playerId);
        }, CURRENT_SETTINGS.spawnDelay);

        this.processedMeteorCollisions.add(data.meteor_id);

        // Get the affected player's side
        const side = data.player_ship === 'spaceship' ? 'left' : 'right';
        
        // Update score
        this.updatePlayerScore(side, -CURRENT_SETTINGS.hitByMeteorPenalty);

        return {
            scoreP1: this.getPlayerScore('left'),
            scoreP2: this.getPlayerScore('right'),
            processed: true
        };
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
            player2: this.players.get(player2).position,
            meteors: this.meteors,  // Initial spawn positions and properties
            respawningPlayers: Array.from(this.respawningPlayers)
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
        // Don't update position if player is respawning
        if (this.respawningPlayers.has(playerId)) {
            return null;
        }

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
            player2: otherPlayerId ? this.players.get(otherPlayerId).position : null
        };
    }

    playerShoot(playerId) {
        /**
         * Handle player shoot action
         * @param {string} playerId - Unique identifier for the player who shot
         */
        // Placeholder for shooting mechanism
        if (this.players.has(playerId)) {
            return {
                side: this.players.get(playerId).side,
                y: this.players.get(playerId).position
            }
        }
    }
}

module.exports = { GameState };