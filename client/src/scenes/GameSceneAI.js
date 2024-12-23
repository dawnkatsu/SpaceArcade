/**
 * GameSceneAI.js
 * -----------------
 * The scene handles gameplay mechanics and keyboard inputs to play against an AI
 * 
 *
 * Author: Kevin Le and Dawn Arrington
 * Date: 12/2/2024
 */

import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'
import { MenuScene } from './MenuScene.js';
import { EndScene } from './EndScene.js';
import { CURRENT_SETTINGS } from '../settings.js';

// Game Timer Variable
var gameTime;

// Player 1 Variables
var scoreP1;
var p1_command;

// Player 2 Variables
var scoreP2;
var p2_command;
let keyW;
let keyS;
let keyJ;

// Laser Variables
var laserDelayP1 = CURRENT_SETTINGS.laserInterval;
var laserDelayP2 = CURRENT_SETTINGS.laserInterval;


export class GameSceneAI extends Phaser.Scene {
    /**
     * Initializes the GameScene
     */
    constructor() {
        super('playGameAI');
        this.socketListeners = []; 
    }

    init() {
        // Reset scores
        scoreP1 = 0;
        scoreP2 = 0;
        p1_command = 0;
        p2_command = 0;
    }

    preload() {
        this.load.image('laser', '../assets/sprites/laser_rotated.png');
        this.load.spritesheet('spaceship', '../assets/sprites/Spaceship2_rotated.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('spaceship2', '../assets/sprites/Spaceship01-rotated.png', {frameWidth: 32, frameHeight: 48});
        this.load.spritesheet('asteroid', '../assets/sprites/Asteroid 01 - Explode.png', { frameWidth: 90, frameHeight: 90, frame: 0 });
        this.load.audio('laserShot', '../assets/sounds/laser.wav');
        this.load.audio('asteroidExplosion', '../assets/sounds/explosion.wav');
        this.load.audio('shipExplosion', '../assets/sounds/explosion12.wav');
    }

    create() {
        // Init
        this.gameOver = false;

        // Set world boundary to allow score
        this.physics.world.setBounds(0, 40, this.scale.width, this.scale.height - 50);

        //  A simple background for our game
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'space')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)
        
        // Create laser group
        this.laserGroupP1 = new LaserGroup(this, this.player);
        this.laserGroupP2 = new LaserGroup(this, this.player2);

        
        // Add player 1 (Left)
        this.player = this.physics.add.sprite(25, 300, 'spaceship');
        this.player.setCollideWorldBounds(true);
        

        // Add Player 2 (Right)
        this.player2 = this.physics.add.sprite(this.scale.width - 25, 300, 'spaceship2');
        this.player2.setCollideWorldBounds(true);
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);

        // AI
        this.timer = this.time.addEvent({
            delay: Phaser.Math.Between(1000, 5000)
        })

        // Game Timer
        this.gameTimer = this.time.addEvent({
            delay: CURRENT_SETTINGS.gameDuration,
        })


        //  Animations
        this.anims.create(
            {
                key: "degredation",
                frames: this.anims.generateFrameNumbers('asteroid', { start: 0, end: 1 }),
                frameRate: CURRENT_SETTINGS.asteroids_frame_rate
            }
        );

        this.anims.create(
            {
                key: "explosion",
                frames: this.anims.generateFrameNumbers('asteroid', { start: 2, end: 6 }),
                frameRate: CURRENT_SETTINGS.asteroids_frame_rate,
                repeat: 0,
                // hideOnComplete: true
            }
        );

        this.anims.create(
            {
                key: 'init_asteroid',
                frames: [ { key: 'asteroid', frame: 0 } ],
                frameRate: CURRENT_SETTINGS.asteroids_frame_rate
            }
        );

        // Generate Meteors
        this.meteors = this.physics.add.group({
            key: 'asteroid',
            repeat: CURRENT_SETTINGS.num_asteroids - 1
        });

        this.generateMeteors()

        // //  Input Events
        this.cursors = this.input.keyboard.createCursorKeys();

        // //  The score and game timer
        this.scoreP1Text = this.add.text(this.scale.width * .2, 20, `SCORE: ${scoreP1}`, { fontSize: '12px'});
        this.scoreP2Text = this.add.text(this.scale.width * .75, 20, `SCORE: ${scoreP2}`, { fontSize: '12px'});
        this.gameTimeText = this.add.text(this.scale.width / 2, 20, gameTime, {fontSize: '12px'});

        WebFontLoader.default.load({
            google: {
                families: ['Press Start 2P']
            },
            active: () => {
                this.scoreP1Text.setFontFamily('"Press Start 2P"').setColor('#ffffff');
                this.scoreP2Text.setFontFamily('"Press Start 2P"').setColor('#ffffff');
                this.gameTimeText.setFontFamily('"Press Start 2P"').setColor('#ffffff');
            }
        })

        // // Hit by meteor. Game over
        this.physics.add.collider(this.player, this.meteors, this.hitByMeteor, null, this);
        this.physics.add.collider(this.player2, this.meteors, this.hitByMeteor, null, this);

        // Hit by enemy laser
        this.physics.add.collider(this.player, this.laserGroupP2, this.hitByLaser, null, this);
        this.physics.add.collider(this.player2, this.laserGroupP1, this.hitByLaser, null, this);
        
        // Shoot meteor collision/physics
        this.physics.add.collider(this.laserGroupP1, this.meteors, this.shotMeteor, null, this);
        this.physics.add.collider(this.laserGroupP2, this.meteors, this.shotMeteor, null, this);
        }

    /**
     * Input handler for P1's key press. If up and down arrows are pressed, send the next expected
     * position to the server for it to update from the server side
     */
    moveP1() {
        // Check for cursor keys/ship movement
        if (this.cursors.up.isDown)
            {
                var curr_pos = this.player.y;
                this.player.setPosition(this.player.x,curr_pos-CURRENT_SETTINGS.shipSpeed)

            }

        else if (this.cursors.down.isDown)
            {

                var curr_pos = this.player.y;
                this.player.setPosition(this.player.x,curr_pos+CURRENT_SETTINGS.shipSpeed)
            } 

        else
            {
                this.player.setVelocityX(0);
                this.player.setVelocityY(0);
            }   

        if (this.cursors.space.isDown)
            {
                if (laserDelayP1 > 0) {
                    return
                }
    
                this.fireLaser(this.player, this.laserGroupP1, this.player.x, this.player.y)
            }
    }

    /**
     * Input handler for P2's key press. If w and s buttons are pressed, send the next expected
     * position to the server for it to update from the server side
     */
    moveP2() {
        if (keyW.isDown) 
        {
            var curr_pos = this.player2.y;
            p2_command = p2_command + 1;

            this.game.socketHandler.sendPlayerMove(curr_pos-CURRENT_SETTINGS.shipSpeed, p2_command)
        }

        else if (keyS.isDown)
        {
            var curr_pos = this.player2.y;
            p2_command = p2_command + 1

            this.game.socketHandler.sendPlayerMove(curr_pos+CURRENT_SETTINGS.shipSpeed, p2_command) 
        }

        else
        {
            this.player2.setVelocityX(0);
            this.player2.setVelocityY(0);
        }

        if (keyJ.isDown)
            {
                if (laserDelayP2 > 0) {
                    return
                }
    
                this.fireLaser(this.player2, this.laserGroupP2, this.player2.x, this.player2.y)
            }
    }

    /**
     * AI player movement logistics. Moves up and down at random, and only allowed to shoot when the laser
     * delay timer is up
     */
    aiPlayer() {
        if (laserDelayP2 > 0) {
            return;
        }
        else {
            this.fireLaser(this.player2, this.laserGroupP2, this.player2.x, this.player2.y)
        }

        const controls = [CURRENT_SETTINGS.shipSpeed*50, -CURRENT_SETTINGS.shipSpeed*50];
        var random = Phaser.Math.Between(0,1);


        const remaining = this.timer.getRemaining();
        //console.log(remaining);
        if (remaining >= 0) {
            this.player2.setVelocityY(controls[random]);
        };
        if (remaining === 0) {
            this.time.addEvent(this.timer);
            random = Phaser.Math.Between(0,1);
        };
    }

    /**
     * Respawn the position of the ship that got hit by either the meteor or the laser
     */
    reset(player) {
        var spawnPosition = 300;
        if (player.texture.key === 'spaceship') {
            player.enableBody(true, 25, spawnPosition, true, true);
        }

        else if (player.texture.key === 'spaceship2') {
            player.enableBody(true, this.scale.width - 25, spawnPosition, true, true);
        }
     }


    update(time, delta) {
        if (this.gameOver)
            {
                this.scene.start('endGame', {scoreP1: scoreP1, scoreP2: scoreP2});
            }        

        
        // Check for laser firing; if delay has not been fulfilled, return to prevent rapid fire
        laserDelayP1 -= delta;
        laserDelayP2 -= delta;
        this.moveP1();

        if (CURRENT_SETTINGS.isSinglePlayer === true) {
            this.aiPlayer();
        }
        else if (CURRENT_SETTINGS.isSinglePlayer === false) {
            this.moveP2();
        } 
        this.generateMeteors()
        this.endGame();
    }

    /**
     * Triggers ship and meteor explosion animation once they are in contact, and respawns the ship
     * after the delay
     */
    hitByMeteor(player, meteor) {
        // Deduct P1 score for crashing into meteor
        player.disableBody(true, true);
        this.sound.play('shipExplosion', {
            volume: .3,
            detune: 0
        })
        this.time.delayedCall(CURRENT_SETTINGS.spawnDelay, this.reset, [player], this);
        if (player.texture.key === 'spaceship') {
            scoreP1 -= CURRENT_SETTINGS.hitByMeteorPenalty;
            if (scoreP1 <= 0) {
                scoreP1 = 0;
            }
            this.scoreP1Text.setText(`SCORE: ${scoreP1}`)
        }

        // Deduct P2 score for crashing into meteor
        if (player.texture.key === 'spaceship2') {
            scoreP2 -= CURRENT_SETTINGS.hitByMeteorPenalty;
            if (scoreP2 <= 0) {
                scoreP2 = 0;
            }
            this.scoreP2Text.setText(`SCORE: ${scoreP2}`)

        }

        // Ship and meteor explodes
        meteor.play("explosion")
    }

    /**
     * Play either degredation or explosion animation depending on the current animation frame, and play
     * the sound of it being destroyed
     */
    destroyMeteor(laser, meteor) {
        let calculated_final_v = (CURRENT_SETTINGS.laserSpeed + meteor.init_x_vel * CURRENT_SETTINGS.asteroids_mass) / CURRENT_SETTINGS.asteroids_mass
        meteor.body.setVelocityX(calculated_final_v)
        meteor.init_x_vel = calculated_final_v
        laser.disableBody(true, true);
        if (meteor.anims.currentAnim.key == "degredation") {
            meteor.play("explosion")
            this.sound.play('asteroidExplosion', {
                volume: .4,
                detune: -200
            })
            meteor.once('animationcomplete', () => {
                meteor.setPosition(-999,-999)
            })

        }
        else {
            this.sound.play('asteroidExplosion', {
                volume: .2,
                rate: 15,
                detune: -3500
            })
            meteor.play("degredation")
            meteor.setOffset(35.3,32.55)

        }
    }

    /**
     * Trigger destroyMeteor function that renders what happens to the meteor once shot, and then award points to the player that shot the meteor
     */
    shotMeteor(laser, meteor) {
        if (laser.player === 'P1') {
        this.destroyMeteor(laser, meteor);
        scoreP1 += CURRENT_SETTINGS.meteorScore;
        this.scoreP1Text.setText(`SCORE: ${scoreP1}`)
        }

        else if (laser.player === 'P2') {
        this.destroyMeteor(laser, meteor);
        scoreP2 += CURRENT_SETTINGS.meteorScore;
        this.scoreP2Text.setText(`SCORE: ${scoreP2}`)
        }
    }

    /**
     * If a ship is hit by the opponent's laser, freeze the velocity and respawn the ship after the delay times out.
     * This awards the points to the ship that shot the opponent down, and deduct the points for the ship that got shot. 
     */
    hitByLaser(player, laser) {
        player.body.setVelocityX(0);
        
        player.disableBody(true, true);

        // Disable laser object on impact
        laser.disableBody(true, true);


        this.time.delayedCall(CURRENT_SETTINGS.spawnDelay, this.reset, [player], this);

        // If P1 shot laser, penalize P2
        if (laser.player === 'P1') {
            scoreP2 -= CURRENT_SETTINGS.hitByLaserPenalty;
            if (scoreP2 <= 0) {
                scoreP2 = 0;
            }
            this.scoreP2Text.setText(`SCORE: ${scoreP2}`)
        }

        // If P2 shot laser, penalize P1
        if (laser.player === 'P2') {
            scoreP1 -= CURRENT_SETTINGS.hitByLaserPenalty;
            if (scoreP1 <= 0) {
                scoreP1 = 0;
            }
            this.scoreP1Text.setText(`SCORE: ${scoreP1}`)
        }
    }

    // Helper function to fire lasers
    fireLaser(player, laserGroup, x, y) {
        // Get first inactive laser object from laser group
        const laser = laserGroup.getFirstDead();

        // Store which player fired the laser
        if (laserGroup === this.laserGroupP1) {
            laser.player = 'P1';
        }

        if (laserGroup === this.laserGroupP2) {
            laser.player = 'P2';
        }

        // If there are no inactive laser objects (i.e. out of bullets), then return
        if (laser === undefined || laser === null) {
            return;
        }

        // If player is inactive, return
        if (!player.active) {
            return;
        }

        // Fire laser from laser class
        laser.fire(x, y)

        // Play laser sound effect
        this.sound.play('laserShot', {
            volume: .1,
            rate: 2,
            detune: -1000
        });
    }

     /**
     * Handles both initial generation and re-generation of meteors. Give each of them a unique size,
     * initial position and velocity
     */   
    generateMeteors() {
        this.meteors.children.iterate(function (child){
            if (child.init_x_vel == null || (child.y < -30 || child.y  > 630 || child.x < -30 || child.x  > 830)) {
                if (child.init_x_vel == null) {
                    // Used when the meteors are initially generated at the beginning of the game
                    var rand_y = Phaser.Math.Between(0, 600);
                }
                else {
                    // Used when the meteors are out of bounds and needs to be regenerated
                    var rand_y = 600 * Phaser.Math.Between(0, 1);
                    var ofst = 20;
                    if (rand_y == 0) {
                        rand_y -= ofst
                    }
                    else {
                        rand_y += ofst
                    }
                    
                }

                var rand_x = Phaser.Math.Between(400 - CURRENT_SETTINGS.asteroids_x_coverage, 400 + CURRENT_SETTINGS.asteroids_x_coverage);
                var rand_vx = Phaser.Math.FloatBetween(CURRENT_SETTINGS.asteroids_x_vel_min, CURRENT_SETTINGS.asteroids_x_vel_max)
                var rand_vy = Phaser.Math.FloatBetween(CURRENT_SETTINGS.asteroids_y_vel_min, CURRENT_SETTINGS.asteroids_y_vel_max)
                child.setPosition(rand_x,rand_y);
                child.setScale(Phaser.Math.FloatBetween(CURRENT_SETTINGS.asteroids_scale_min, CURRENT_SETTINGS.asteroids_scale_max))
                child.setVelocity(rand_vx, rand_vy);
                child.allowGravity = false;
                child.setSize(34.5,31.5)
                child.setOffset(30,32.55)
                child.init_x_vel = rand_vx
                child.enableBody()
                child.play("init_asteroid")
                child.anims.restart()
                
            }
        });
    }


    endGame() {
        gameTime = this.gameTimer.getOverallRemainingSeconds();
        this.gameTimeText.setText(Math.round(gameTime));


        if (this.gameTimer.getRemaining() === 0) {
            this.gameOver = true;
        }
    }
    
}

/* 
 *  LaserGroup creates multiple Laser objects with key 'laser'
 *  laserMax variable designates how many Laser objects to be created
 */

class LaserGroup extends Phaser.Physics.Arcade.Group
{
    constructor(scene, player) {
        super(scene.physics.world, scene);
        player;
        this.createMultiple({
            classType: Laser,
            frameQuantity: CURRENT_SETTINGS.laserMax,
            active: false,
            visible: false,
            key: 'laser'
        })
    }
}

/*
 * Laser class that dictates laser behavior
 * variables: laserInterval, laserLifespan
 */
class Laser extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, player) {
        super(scene, x, y, 'laser');
    }

    player;

    fire(x, y) {
        // Initialize laser position in reference to player ship
        if (x <= 400) {
            x = x + 20;
        }
        else if (x > 400) {
            x = x - 20;
        }

        this.enableBody(true, x, y, true, true);

        // If P2 fired, flip laser/velocity direction
        if (this.player === 'P2')
        {
            this.body.velocity.x -= CURRENT_SETTINGS.laserSpeed;
            laserDelayP2 = CURRENT_SETTINGS.laserInterval;
        }
        else 
        {
            this.body.velocity.x += CURRENT_SETTINGS.laserSpeed;
            laserDelayP1 = CURRENT_SETTINGS.laserInterval;
        }

        // Lifespan of laser object before being recycled
        this.setState(CURRENT_SETTINGS.laserLifespan)
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // If laser object goes past game window, set inactive for reuse
        if (this.x <= 0 || this.x >= 800) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}