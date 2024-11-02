import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'


// Player Configuration
const shipSpeed = 150;
var scoreP1 = 0;
var scoreP2 = 0;

// Laser Configuration
const laserMax = 20;
const laserInterval = 300;
const laserSpeed = 200;
const laserLifespan = 5;
var laserDelay = laserInterval;

// Meteor Configuration
const asteroids_x_vel_min = -5;
const asteroids_x_vel_max = 5;
const asteroids_y_vel_min = -5;
const asteroids_y_vel_max = 5;
const asteroids_x_coverage = 200;
const asteroids_scale_min = 1;
const asteroids_scale_max = 1.5;
const num_asteroids = 10;
const asteroids_frame_rate = 30;
const asteroids_mass = 10000;

export class GameScene extends Phaser.Scene {
    constructor() {
        super('playGame');

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
        this.physics.world.setBounds(0,50);

        //  A simple background for our game
        this.add.image(400, 300, 'space');
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'space')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)

        
        // Add player 1 (Left)
        this.player = this.physics.add.sprite(25, 300, 'spaceship');
        this.player.setCollideWorldBounds(true);

        // Add Player 2 (Right)
        this.player2 = this.physics.add.sprite(this.scale.width - 25, 300, 'spaceship2');
        this.player2.setCollideWorldBounds(true);

        // //  Animations
        this.anims.create(
            {
                key: "degredation",
                frames: this.anims.generateFrameNumbers('asteroid', { start: 0, end: 1 }),
                frameRate: asteroids_frame_rate
            }
        );

        this.anims.create(
            {
                key: "explosion",
                frames: this.anims.generateFrameNumbers('asteroid', { start: 2, end: 6 }),
                frameRate: asteroids_frame_rate,
                repeat: 0,
                hideOnComplete: true
            }
        );

        // Generate Meteors
        this.meteors = this.physics.add.group({
            key: 'asteroid',
            repeat: num_asteroids
        });

        this.meteors.children.iterate(function (child) {
            var rand_x = Phaser.Math.Between(400 - asteroids_x_coverage, 400 + asteroids_x_coverage);
            var rand_y = Phaser.Math.Between(0, 600);
            var rand_vx = Phaser.Math.FloatBetween(asteroids_x_vel_min, asteroids_x_vel_max)
            var rand_vy = Phaser.Math.FloatBetween(asteroids_y_vel_min, asteroids_y_vel_max)
            child.setPosition(rand_x,rand_y);
            child.setScale(Phaser.Math.FloatBetween(asteroids_scale_min,asteroids_scale_max))
            child.setVelocity(rand_vx, rand_vy);
            child.allowGravity = false;
            child.setSize(34.5,31.5)
            child.setOffset(30,32.55)
            child.init_x_vel = rand_vx

        });


        // Lasers
        // Create laser group
        this.laserGroup = this.physics.add.group({
            name: `lasers-${Phaser.Math.RND.uuid()}`,
            enable: false,
        });

        // Initialize given number of laser objects
        this.laserGroup.createMultiple({
            key: 'laser',
            quantity: laserMax,
            active: false,
            visible: false,
        });

        // Monitor laser states in order to recycle unused laser objects
        this.laserGroup.scene.physics.world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, this.worldStep, this);
        this.laserGroup.once(
            Phaser.GameObjects.Events.DESTROY,
            () => {
                this.laserGroup.scene.physics.world.off(Phaser.Physics.Arcade.Events.WORLD_STEP, this.update, this);
            }, 
            this
        );

        // // // Generate meteors
        // let meteors = this.physics.add.group({
        //     key: 'meteor',
        //     repeat: meteorInitialCount
        // });

        // meteors.children.iterate(function (child,player) {
        //     // var rand_x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        //     // var rand_y = (player.y < 300) ? Phaser.Math.Between(300, 600) : Phaser.Math.Between(0, 300);
        //     var rand_x = Phaser.Math.Between(meteorXmin, meteorXmax);
        //     var rand_y = Phaser.Math.Between(meteorYmin, meteorYmax);
        //     child.setPosition(rand_x,rand_y);
        //     child.setVelocity(Phaser.Math.Between(-meteorSpeed, meteorSpeed), Phaser.Math.Between(-meteorSpeed, meteorSpeed));
        //     child.allowGravity = false;

        // });


        // //  Input Events
        this.cursors = this.input.keyboard.createCursorKeys();

        // //  The score
        this.scoreP1Text = this.add.text(5, 20, `SCORE: ${scoreP1}`, { fontSize: '12px'});
        this.scoreP2Text = this.add.text(this.scale.width - 100, 20, `SCORE: ${scoreP2}`, { fontSize: '12px'});
        WebFontLoader.default.load({
            google: {
                families: ['Press Start 2P']
            },
            active: () => {
                this.scoreP1Text.setFontFamily('"Press Start 2P"').setColor('#ffffff');
                this.scoreP2Text.setFontFamily('"Press Start 2P"').setColor('#ffffff');
            }
        })


        // // Hit by meteor. Game over
        this.physics.add.collider(this.player, this.meteors, this.hitByMeteor, null, this);

        // this.physics.add.collider(laser, enemy, shoot)

        // Shoot meteor collision/physics
        this.physics.add.collider(this.laserGroup, this.meteors, this.shotMeteor, null, this);

        
        }

    update(ts, dt) {
        if (this.gameOver)
            {
                this.scene.start('bootGame');
            }

        // Check for laser firing; if delay has not been fulfilled, return to prevent rapid fire
        laserDelay -= dt;
        if (this.cursors.space.isDown)
        {
            if (laserDelay > 0) {
                return
            }

            this.fireLaser()
        }

        // Check for cursor keys/ship movement
        if (this.cursors.up.isDown)
        {
            this.player.setVelocityY(-shipSpeed)    
        }
        else if (this.cursors.down.isDown)
        {
            this.player.setVelocityY(shipSpeed);
    
        }    
        else
        {
            this.player.setVelocityX(0);
            this.player.setVelocityY(0);
        }
                
    }

    hitByMeteor(player, meteor) {
        // Ship and meteor explodes
        meteor.play("explosion")
        player.play("explosion")

        this.physics.pause();
        this.player.setTint(0xff0000);
        this.gameOver = true;
    }

    destroyMeteor(laser,meteor) {

        let calculated_final_v = (laserSpeed+meteor.init_x_vel*asteroids_mass)/asteroids_mass
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
        }
    }

    shotMeteor(laser, meteor) {
        this.destroyMeteor(laser, meteor);
        scoreP1 += 100;
        this.scoreP1Text.setText(`SCORE: ${scoreP1}`)

    }

    // Helper function to fire lasers
    fireLaser() {
        // Get first inactive laser object from laser group
        const laser = this.laserGroup.getFirstDead();

        // If there are no inactive laser objects (i.e. out of bullets), then return
        if (laser === undefined || laser === null) {
            return;
        }

        // Play laser sound effect
        this.sound.play('laserShot', {
            volume: .1,
            rate: 2,
            detune: -1000
        });


        // Initialize laser position in reference to player ship
        const x = this.player.x + 20;
        const y = this.player.y;
        laser.enableBody(true, x, y, true, true);
        laser.body.velocity.x += laserSpeed;


        // Lifespan of laser object before being recycled
        laser.setState(laserLifespan)

        laserDelay = laserInterval;
        
    }

    // Helper function utilizing WORLD_STEP to destroy idle laser objects
    worldStep(delta) {
        this.laserGroup.getChildren().forEach((laser) => {
            if (!laser.active) {
                return;
            }

            laser.state -= delta;
            if (laser.state <= 0) {
                laser.disableBody(true, true);
            }
        });
    }

    adjustVelocity() {
        
    }
}