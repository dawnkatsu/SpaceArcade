import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'
import { MenuScene } from './MenuScene.js';
import { CURRENT_SETTINGS } from '../settings.js';

// Game Timer Variable
var gameTime;

// Player 1 Variables
var scoreP1 = 0;

// Player 2 Variables
var scoreP2 = 0;
let keyW;
let keyS;
let keyJ;

// Laser Variables
var laserDelayP1 = CURRENT_SETTINGS.laserInterval;
var laserDelayP2 = CURRENT_SETTINGS.laserInterval;


export class GameScene extends Phaser.Scene {
    constructor() {
        super('playGame');
    }

    init() {
        this.isSinglePlayer = 0;
    }

    preload() {
        this.load.image('laser', '../assets/sprites/laser_rotated.png');
        this.load.spritesheet('spaceship', '../assets/sprites/Spaceship2_rotated.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('spaceship2', '../assets/sprites/Spaceship01-rotated.png', {frameWidth: 32, frameHeight: 48});
        this.load.spritesheet('asteroid', '../assets/sprites/Asteroid 01 - Explode.png', { frameWidth: 90, frameHeight: 90, frame: 0 });
        this.load.audio('laserShot', '../assets/sounds/laser.wav');
        this.load.audio('asteroidExplosion', '../assets/sounds/explosion.wav');
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

        // Spawn Timer
        // this.spawnTimer = this.time.addEvent({
        //     delay: 5000,
        //     callback: 
        // })


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
                hideOnComplete: true
            }
        );

        // Generate Meteors
        this.meteors = this.physics.add.group({
            key: 'asteroid',
            repeat: CURRENT_SETTINGS.num_asteroids
        });

        this.meteors.children.iterate(function (child) {
            var rand_x = Phaser.Math.Between(400 - CURRENT_SETTINGS.asteroids_x_coverage, 400 + CURRENT_SETTINGS.asteroids_x_coverage);
            var rand_y = Phaser.Math.Between(0, 600);
            var rand_vx = Phaser.Math.FloatBetween(CURRENT_SETTINGS.asteroids_x_vel_min, CURRENT_SETTINGS.asteroids_x_vel_max)
            var rand_vy = Phaser.Math.FloatBetween(CURRENT_SETTINGS.asteroids_y_vel_min, CURRENT_SETTINGS.asteroids_y_vel_max)
            child.setPosition(rand_x,rand_y);
            child.setScale(Phaser.Math.FloatBetween(CURRENT_SETTINGS.asteroids_scale_min, CURRENT_SETTINGS.asteroids_scale_max))
            child.setVelocity(rand_vx, rand_vy);
            child.allowGravity = false;
            child.setSize(34.5,31.5)
            child.setOffset(30,32.55)
            child.init_x_vel = rand_vx

        });

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

    moveP1() {
        // Check for cursor keys/ship movement
        if (this.cursors.up.isDown)
            {
                this.player.setVelocityY(-CURRENT_SETTINGS.shipSpeed)    
            }

        else if (this.cursors.down.isDown)
            {
                this.player.setVelocityY(CURRENT_SETTINGS.shipSpeed);
        
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
    
                this.fireLaser(this.laserGroupP1, this.player.x, this.player.y)
            }
    }

    moveP2() {
        if (keyW.isDown) 
        {
            this.player2.setVelocityY(-CURRENT_SETTINGS.shipSpeed)
        }

        else if (keyS.isDown)
        {
            this.player2.setVelocityY(CURRENT_SETTINGS.shipSpeed);
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
    
                this.fireLaser(this.laserGroupP2, this.player2.x, this.player2.y)
            }
    }

    aiPlayer() {
        if (laserDelayP2 > 0) {
            return;
        }
        else {
            this.fireLaser(this.laserGroupP2, this.player2.x, this.player2.y)
        }

        const controls = [CURRENT_SETTINGS.shipSpeed, -CURRENT_SETTINGS.shipSpeed];
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

    reset(player) {
        if (player.texture.key === 'spaceship') {
            player.enableBody(true, 25, 300, true, true);
        }

        else if (player.texture.key === 'spaceship2') {
            player.enableBody(true, this.scale.width - 25, 300, true, true);
        }
     }


    update(ts, dt) {
        if (this.gameOver)
            {
                this.scene.start('bootGame', scoreP1 = 0, scoreP2 = 0);
            }        

        
        // Check for laser firing; if delay has not been fulfilled, return to prevent rapid fire
        laserDelayP1 -= dt;
        laserDelayP2 -= dt;
        this.moveP1();

        if (CURRENT_SETTINGS.isSinglePlayer === true) {
            this.aiPlayer();
        }
        else if (CURRENT_SETTINGS.isSinglePlayer === false) {
            this.moveP2();
        } 
        
        this.endGame();
    }

    hitByMeteor(player, meteor) {
        // Deduct P1 score for crashing into meteor
        console.log(player.texture.key, ' hit!')
        player.disableBody(true, true);
        this.time.delayedCall(5000, this.reset(player), [], this);
        if (player.texture.key === 'spaceship') {
            //player.disableBody(true, true);
            //this.time.delayedCall(5000, this.reset(player), [], this);
            //console.log(spawnTimerP1.getRemaining());
            scoreP1 -= 250;
            if (scoreP1 <= 0) {
                scoreP1 = 0;
            }
            this.scoreP1Text.setText(`SCORE: ${scoreP1}`)
        }

        // Deduct P2 score for crashing into meteor
        if (player.texture.key === 'spaceship2') {
            //player.disableBody(true, true);
            //this.time.delayedCall(5000, this.reset(player), [], this);
            scoreP2 -= 250;
            if (scoreP2 <= 0) {
                scoreP2 = 0;
            }
            this.scoreP2Text.setText(`SCORE: ${scoreP2}`)

        }

        // Ship and meteor explodes
        meteor.play("explosion")
        // player.play("explosion")

        //this.physics.pause();
        //this.player.setTint(0xff0000);
        //this.gameOver = true;
    }

    destroyMeteor(laser,meteor) {
        let calculated_final_v = (CURRENT_SETTINGS.laserSpeed + meteor.init_x_vel * CURRENT_SETTINGS.asteroids_mass) / CURRENT_SETTINGS.asteroids_mass
        meteor.body.setVelocityX(calculated_final_v)
        meteor.init_x_vel = calculated_final_v
        laser.disableBody(true, true);
        if (meteor.anims.currentFrame != null) {
            meteor.play("explosion")
            this.sound.play('asteroidExplosion', {
                volume: .4,
                detune: -200
            })
            meteor.once('animationcomplete', () => {
                meteor.destroy(true)
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

            
            //console.log(laser.player)
        }
    }

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

    hitByLaser(player, laser) {
        player.body.setVelocityX(0);

        // Disable laser object on impact
        laser.disableBody(true, true);

        // If P1 shot laser, penalize P2
        if (laser.player === 'P1') {
            scoreP2 -= CURRENT_SETTINGS.hitPenalty;
            if (scoreP2 <= 0) {
                scoreP2 = 0;
                //this.scoreP2Text.setText(`SCORE: ${scoreP2}`)
            }
            this.scoreP2Text.setText(`SCORE: ${scoreP2}`)
        }

        // If P2 shot laser, penalize P1
        if (laser.player === 'P2') {
            scoreP1 -= CURRENT_SETTINGS.hitPenalty;
            if (scoreP1 <= 0) {
                scoreP1 = 0;
                //this.scoreP1Text.setText(`SCORE: ${scoreP1}`)
            }
            this.scoreP1Text.setText(`SCORE: ${scoreP1}`)
        }
    }

    // Helper function to fire lasers
    fireLaser(laserGroup, x, y) {
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

        // Fire laser from laser class
        laser.fire(x, y)

        // Play laser sound effect
        this.sound.play('laserShot', {
            volume: .1,
            rate: 2,
            detune: -1000
        });
                
    }

    endGame() {
        gameTime = this.gameTimer.getOverallRemainingSeconds();
        this.gameTimeText.setText(Math.round(gameTime));


        if (this.gameTimer.getRemaining() === 0) {
            this.gameOver = true;
        }
    }
    

    adjustVelocity() {
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