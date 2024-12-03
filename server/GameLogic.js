/**
 * game_logic.js
 * ------------
 * Game state management for the Space Battle Multiplayer Game.
 * 
 * This module handles:
 * - Player management and scoring
 * - Game state tracking and updates
 * - Meteor generation and collision detection
 * - Player respawn mechanics
 * 
 * @module GameLogic
 * @requires ./settings
 */

const { CURRENT_SETTINGS } = require('./settings');

/**
 * Manages the state and logic for a single game session
 */
class GameState {
    /**
     * Creates a new game state instance.
     * Initializes player tracking and generates initial meteor positions.
     */
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

    /**
     * Adds a new player to the game.
     * Assigns them to either the left or right side based on join order.
     * 
     * @param {string} playerId - Unique identifier for the player
     * @param {string} username - Player's display name
     * @returns {string} The side assigned to the player ('left' or 'right')
     */
    addPlayer(playerId, username) {
        const side = this.players.size === 0 ? 'left' : 'right';
        this.players.set(playerId, {
            username: username,
            side: side,
            position: 300,  // Middle of screen (assuming 600 height)
            score: 0       // Initialize score to 0
        });
        return side;
    }

    /**
     * Removes a player from the game.
     * 
     * @param {string} playerId - Unique identifier for the player to remove
     */
    removePlayer(playerId) {
        this.players.delete(playerId);
    }

    /**
     * Gets the side ('left' or 'right') assigned to a player.
     * 
     * @param {string} playerId - Unique identifier for the player
     * @returns {string} The side ('left' or 'right') assigned to the player
     */
    getPlayerSide(playerId) {
        return this.players.get(playerId).side;
    }

    /**
     * Gets the score for a specified side.
     * 
     * @param {string} side - The side to get the score for ('left' or 'right')
     * @returns {number} The current score for that side
     */
    getPlayerScore(side) {
        for (const [_, player] of this.players) {
            if (player.side === side) {
                return player.score;  
            }
        }
        return 0;  // Only returns 0 if no player found with that side
    }

    /**
     * Updates the score for a specified side.
     * 
     * @param {string} side - The side to update ('left' or 'right')
     * @param {number} change - Amount to change the score by (can be negative)
     */
    updatePlayerScore(side, change) {
        for (const [_, player] of this.players) {
            if (player.side === side) {
                player.score = Math.max(0, player.score + change);
                return;
            }
        }
    }

    /**
     * Generates a new meteor with random properties.
     * Creates meteors either in the play area or off-screen for respawning.
     * 
     * @param {boolean} [isOutOfBounds=false] - Whether the meteor is being respawned
     * @returns {Object} A meteor object with the following properties:
     * @returns {string} .id - Unique identifier for the meteor
     * @returns {number} .x - X coordinate
     * @returns {number} .y - Y coordinate
     * @returns {number} .velocityX - Horizontal velocity
     * @returns {number} .velocityY - Vertical velocity
     * @returns {number} .scale - Size multiplier
     * @returns {number} .init_x_vel - Initial horizontal velocity
     */
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

    /**
     * Respawns a meteor that has gone out of bounds.
     * Generates a new meteor and replaces the old one.
     * 
     * @param {string} meteorId - ID of the meteor to respawn
     */
    respawnMeteor(meteorId) {
        this.processedMeteorCollisions.delete(meteorId);
        const index = this.meteors.findIndex(m => m.id === meteorId);
        if (index !== -1) {
            this.meteors[index] = this.generateNewMeteor(true);
        }
    }

    /**
     * Handles collision between a meteor and a player's ship.
     * Updates scores, triggers respawn state, and returns updated game state.
     * 
     * @param {string} playerId - ID of the player involved in collision
     * @param {Object} data - Collision data
     * @param {string} data.meteor_id - ID of the meteor involved
     * @param {string} data.player_ship - Identifier of the ship that was hit
     * @returns {Object} Updated game state including:
     * @returns {number} .scoreP1 - Current score for player 1
     * @returns {number} .scoreP2 - Current score for player 2
     * @returns {boolean} .processed - Whether the collision was processed
     */
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

    /**
     * Gets the current state of the game for all players.
     * 
     * @returns {Object} Current game state including:
     * @returns {number} .player1 - Position of player 1
     * @returns {number} .player2 - Position of player 2
     * @returns {number} .player1Score - Score of player 1
     * @returns {number} .player2Score - Score of player 2
     * @returns {Array} .meteors - Array of active meteors
     * @returns {Array} .respawningPlayers - Array of players currently respawning
     */
    getState() {
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
            player1Score: this.players.get(player1).score,
            player2Score: this.players.get(player2).score,
            meteors: this.meteors,  // Initial spawn positions and properties
            respawningPlayers: Array.from(this.respawningPlayers)
        };
    }

    /**
     * Handles cleanup when a player disconnects from the game.
     * 
     * @param {string} playerId - ID of the disconnected player
     */
    handlePlayerDisconnect(playerId) {
        this.removePlayer(playerId);
        this.gameStarted = false;
    }

    /**
     * Updates a player's vertical position.
     * Ignores updates for players who are currently respawning.
     * 
     * @param {string} playerId - ID of the player to update
     * @param {number} y - New vertical position
     * @returns {Object|null} Updated positions of both players, or null if player is respawning
     */
    updatePlayerPosition(playerId, y) {
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

    /**
     * Processes a player's shoot action.
     * 
     * @param {string} playerId - ID of the player who shot
     * @returns {Object} Information about the shot:
     * @returns {string} .side - Which side the shot came from ('left' or 'right')
     * @returns {number} .y - Vertical position of the shot
     */
    playerShoot(playerId) {
        if (this.players.has(playerId)) {
            return {
                side: this.players.get(playerId).side,
                y: this.players.get(playerId).position
            }
        }
    }
}

module.exports = { GameState };