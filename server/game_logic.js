import Phaser from 'phaser';
import { Settings } from '../settings.js';

class GameLogic {
    constructor() {
        // Initialize Phaser game instance headlessly
        this.game = new Phaser.Game({
            type: Phaser.HEADLESS,
            width: 800,
            height: 600,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: {
                create: this.create.bind(this),
                update: this.update.bind(this)
            },
            autoFocus: false
        });

        this.settings = new Settings();
        this.players = new Map();
        this.gameState = {
            players: {},
            meteors: [],
            lasers: [],
            scores: {},
            gameTime: this.settings.gameDuration
        };
        // Laser delay tracking for each player
        this.playerLaserDelays = new Map();
    }

    create() {
        // Initialize physics world bounds
        this.physics.world.setBounds(0, 40, 800, 550);
        
        // Initialize meteor group
        this.meteors = this.physics.add.group({
            key: 'asteroid',
            repeat: this.settings.num_asteroids
        });

        // Generate meteors 
        this.meteors.children.iterate((meteor) => {
            // Initial position
            const rand_x = Phaser.Math.Between(
                400 - this.settings.asteroids_x_coverage, 
                400 + this.settings.asteroids_x_coverage
            );
            const rand_y = Phaser.Math.Between(0, 600);
            
            // Initial velocity
            const rand_vx = Phaser.Math.FloatBetween(
                this.settings.asteroids_x_vel_min, 
                this.settings.asteroids_x_vel_max
            );
            const rand_vy = Phaser.Math.FloatBetween(
                this.settings.asteroids_y_vel_min, 
                this.settings.asteroids_y_vel_max
            );
            
            // Set meteor properties
            meteor.setPosition(rand_x, rand_y);
            meteor.setScale(Phaser.Math.FloatBetween(
                this.settings.asteroids_scale_min, 
                this.settings.asteroids_scale_max
            ));
            meteor.setVelocity(rand_vx, rand_vy);
            meteor.allowGravity = false;
            
            // Set collision box
            meteor.setSize(34.5, 31.5);
            meteor.setOffset(30, 32.55);
            
            // Store initial velocity for collision calculations
            meteor.init_x_vel = rand_vx;

            // Degradation state tracking
            meteor.hits = 0;

            // Add to gameState
            this.gameState.meteors.push({
                x: meteor.x,
                y: meteor.y,
                velocityX: meteor.body.velocity.x,
                velocityY: meteor.body.velocity.y,
                scale: meteor.scale,
                init_x_vel: meteor.init_x_vel,
                hits: meteor.hits,
                state: 'normal' // possible states: normal, degraded, exploding
            });
        });

        // Initialize laser groups for both players
        this.laserGroups = new Map();
    }

    addPlayer(playerId, username) {
        const isFirstPlayer = this.players.size === 0;
        const x = isFirstPlayer ? 25 : 775;
        
        const player = {
            id: playerId,
            username: username,
            x: x,
            y: 300,
            velocityY: 0,
            score: 0,
            isActive: true,
            side: isFirstPlayer ? 'left' : 'right'
        };

        this.players.set(playerId, player);
        this.laserGroups.set(playerId, this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: this.settings.laserMax,
            active: false,
            visible: false,
            key: 'laser'
        }));
        
        // Initialize laser delay for this player
        this.playerLaserDelays.set(playerId, 0);
        
        return player;
    }

    handleLaserMeteorCollision(laser, meteor, playerId) {
        const player = this.players.get(playerId);

        // Collision physics
        const calculated_final_v = (this.settings.laserSpeed + meteor.init_x_vel * 
            this.settings.asteroids_mass) / this.settings.asteroids_mass;
        meteor.body.setVelocityX(calculated_final_v);
        meteor.init_x_vel = calculated_final_v;

        // Increment hit counter
        meteor.hits++;

        // Find corresponding meteor state
        const meteorState = this.gameState.meteors.find(m => 
            m.x === meteor.x && m.y === meteor.y
        );

        if (meteor.hits === 1) {
            // First hit: Degradation
            if (meteorState) {
                meteorState.state = 'degraded';
                meteorState.hits = 1;
                meteorState.velocityX = calculated_final_v;
                meteorState.init_x_vel = calculated_final_v;
            }
            meteor.setOffset(35.3, 32.55);
        } else if (meteor.hits >= 2) {
            // Second hit: Explosion and destruction
            if (meteorState) {
                meteorState.state = 'exploding';
                meteorState.hits = 2;
            }

            // Schedule meteor removal after explosion animation would complete
            setTimeout(() => {
                meteor.destroy();
                const index = this.gameState.meteors.indexOf(meteorState);
                if (index > -1) {
                    this.gameState.meteors.splice(index, 1);
                }
            }, 200); // Adjust timing to match animation duration
        }

        // Update score
        player.score += this.settings.meteorScore;

        // Remove laser
        laser.destroy();

        // Remove from lasers array
        const laserIndex = this.gameState.lasers.findIndex(l => 
            l.x === laser.x && l.y === laser.y
        );
        if (laserIndex > -1) {
            this.gameState.lasers.splice(laserIndex, 1);
        }
    }
    
    handlePlayerMove(playerId, y) {
        const player = this.players.get(playerId);
        if (!player.isActive) return;

        if (moveType === 'up') {
            player.velocityY = -this.settings.shipSpeed;
        } 
        else if (moveType === 'down') {
            player.velocityY = this.settings.shipSpeed;
        }
        else {
            player.velocityY = 0;
        }

        // Update position based on velocity
        player.y = Phaser.Math.Clamp(
            player.y + player.velocityY * (1/60), // assuming 60 FPS
            40, // world bounds top
            550  // world bounds bottom
        );
    }

    fireLaser(playerId) {
        const player = this.players.get(playerId);
        const laserGroup = this.laserGroups.get(playerId);

        // Get first inactive laser from group 
        const laser = laserGroup.getFirstDead();
        
        // If no inactive lasers available or player is respawning, return
        if (!laser || !player.isActive) {
            return false;
        }

        // Set laser position based on player side 
        let x = player.x;
        if (player.side === 'left') {
            x = player.x + 20;
        } else {
            x = player.x - 20;
        }

        // Activate laser and set position
        laser.enableBody(true, x, player.y, true, true);
        
        // Set velocity based on player side
        const velocity = player.side === 'left' ? 
            this.settings.laserSpeed : -this.settings.laserSpeed;
        laser.setVelocityX(velocity);

        // Store player ID with laser for collision handling
        laser.playerId = playerId;

        // Reset laser delay for this player
        this.playerLaserDelays.set(playerId, this.settings.laserInterval);

        // Set laser lifespan
        this.time.delayedCall(this.settings.laserLifespan * 1000, () => {
            laser.disableBody(true, true);
        });

        return true;
    }


    update(time, delta) {
        // Update game time
        this.gameState.gameTime -= delta;

        // Check for game end based on time
        if (this.gameState.gameTime <= 0) {
            this.endGame();
            return;
        }

        // Update meteor positions and check collisions
        this.meteors.children.iterate((meteor) => {
            if (!meteor) return;

            // Check laser collisions
            this.laserGroups.forEach((laserGroup, playerId) => {
                this.physics.overlap(laserGroup, meteor, (laser, meteor) => {
                    this.handleLaserMeteorCollision(laser, meteor, playerId);
                });
            });
        });

        // Update players and handle collisions
        this.players.forEach((player, playerId) => {
            // Apply velocity
            if (player.velocityY !== 0) {
                player.y = Phaser.Math.Clamp(
                    player.y + player.velocityY * (delta/1000),
                    40,
                    550
                );
            }

            // Check meteor collisions
            this.meteors.children.iterate((meteor) => {
                if (this.checkCollision(player, meteor)) {
                    this.handlePlayerMeteorCollision(playerId, meteor);
                }
            });

            // Check laser hits
            this.laserGroups.forEach((laserGroup, shooterId) => {
                if (shooterId !== playerId) {  // Don't check player's own lasers
                    laserGroup.children.iterate((laser) => {
                        if (this.checkCollision(player, laser)) {
                            this.handlePlayerLaserCollision(player, laser, shooterId);
                        }
                    });
                }
            });
        });

        // Update laser delays
        this.playerLaserDelays.forEach((delay, playerId) => {
            if (delay > 0) {
                this.playerLaserDelays.set(playerId, Math.max(0, delay - delta));
            }
        });

        // Clear out-of-bounds lasers
        this.laserGroups.forEach((group) => {
            group.children.iterate(laser => {
                if (laser && (laser.x <= 0 || laser.x >= 800)) {
                    laser.disableBody(true, true);
                }
            });
        });

        // Update game state for clients
        this.updateGameState();
    }

    checkCollision(obj1, obj2) {
        // Simple AABB collision check
        return Phaser.Geom.Rectangle.Overlaps(
            new Phaser.Geom.Rectangle(obj1.x - 16, obj1.y - 24, 32, 48),
            new Phaser.Geom.Rectangle(obj2.x - 17.25, obj2.y - 15.75, 34.5, 31.5)
        );
    }

    handlePlayerMeteorCollision(playerId, meteor) {
        const player = this.players.get(playerId);
        
        // Update score
        player.score = Math.max(0, player.score - this.settings.hitByMeteorPenalty);

        // Disable player temporarily
        player.isActive = false;

        // Trigger meteor explosion
        const meteorState = this.gameState.meteors.find(m => 
            m.x === meteor.x && m.y === meteor.y
        );
        if (meteorState) {
            meteorState.state = 'exploding';
        }

        // Schedule meteor removal after explosion animation would complete
        setTimeout(() => {
            meteor.destroy();
            const index = this.gameState.meteors.indexOf(meteorState);
            if (index > -1) {
                this.gameState.meteors.splice(index, 1);
            }
        }, 200);

        // Schedule player respawn after delay
        setTimeout(() => {
            // Reset player position to original spawn point
            if (player.side === 'left') {
                player.x = 25;
            } else {
                player.x = 775;
            }
            player.y = 300;
            player.isActive = true;
        }, this.settings.spawnDelay);
    }

    handlePlayerLaserCollision(player, laser, shooterId) {
        const hitPlayer = this.players.get(player.id);
        const shooter = this.players.get(shooterId);
        
        // Update score (floored at 0)
        player.score = Math.max(0, player.score - this.settings.hitByLaserPenalty);
        
        // Disable player temporarily
        player.isActive = false;

        // Remove laser
        laser.destroy();

        // Schedule player respawn after delay
        setTimeout(() => {
            // Reset player position to original spawn point
            if (player.side === 'left') {
                player.x = 25;
            } else {
                player.x = 775;
            }
            player.y = 300;
            player.isActive = true;
        }, this.settings.spawnDelay);
    }

    updateGameState() {
        // Update players state
        this.players.forEach((player, id) => {
            this.gameState.players[id] = {
                x: player.x,
                y: player.y,
                score: player.score,
                side: player.side,
                isActive: player.isActive,
                laserDelay: this.playerLaserDelays.get(id) 
            };
        });

        // Update meteors state with all properties
        this.gameState.meteors = this.meteors.children.entries.map(meteor => ({
            x: meteor.x,
            y: meteor.y,
            velocityX: meteor.body.velocity.x,
            velocityY: meteor.body.velocity.y,
            scale: meteor.scale,
            init_x_vel: meteor.init_x_vel,
            hits: meteor.hits,
            state: meteor.hits === 0 ? 'normal' : 
                   meteor.hits === 1 ? 'degraded' : 'exploding'
        }));

        // Update lasers state
        this.gameState.lasers = [];
        this.laserGroups.forEach((group) => {
            group.children.entries.forEach(laser => {
                this.gameState.lasers.push({
                    x: laser.x,
                    y: laser.y,
                    playerId: laser.playerId
                });
            });
        });
    }


    getState() {
        return this.gameState;
    }

    endGame() {
        // Determine winner based on score
        let winner = null;
        let highestScore = -Infinity;  // Allow for negative scores

        this.players.forEach((player) => {
            if (player.score > highestScore) {
                highestScore = player.score;
                winner = player.username;
            }
        });

        return {
            winner,
            scores: Object.fromEntries(
                Array.from(this.players.entries()).map(([id, player]) => [
                    id,
                    player.score
                ])
            ),
            gameOver: true
        };
    }
}

export default GameLogic;