import Phaser from '../../lib/phaser.js'

// Player Configuration
const shipSpeed = 150;

// Laser Configuration
const laserMax = 10;
const laserInterval = 300;
const laserSpeed = 300;
const laserLifespan = 3;
var laserDelay = laserInterval;

export class GameScene extends Phaser.Scene {
    constructor() {
        super('playGame');

    }

    preload() {
        this.load.image('laser', '../assets/sprites/laser_rotated.png');
        this.load.image('meteor', '../assets/sprites/Asteroids.png');
        this.load.spritesheet('spaceship', '../assets/sprites/Spaceship2_rotated.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('spaceship2', '../assets/sprites/Spaceship01-rotated.png', {frameWidth: 32, frameHeight: 48});

    }

    create() {
        this.gameOver = false;

        //  A simple background for our game
        this.add.image(400, 300, 'space');
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'space')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)

        
        // // Add player 1 (Left)
        this.player = this.physics.add.sprite(25, 300, 'spaceship');
        this.player.setCollideWorldBounds(true);

        // Add Player 2 (Right)
        this.player2 = this.physics.add.sprite(this.scale.width - 25, 300, 'spaceship2');
        this.player2.setCollideWorldBounds(true);

        // //  Animations


        // // Lasers
        this.laserGroup = this.physics.add.group({
            name: 'lasers-${Phaser.Math.RND.uuid()}',
            enable: false,
        });
        this.laserGroup.createMultiple({
            key: 'laser',
            quantity: laserMax,
            active: false,
            visible: false,
        });

        // // Generate meteors
        let meteors = this.physics.add.group({
            key: 'meteor',
            repeat: 10
        });

        meteors.children.iterate(function (child,player) {
            var rand_x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
            var rand_y = (player.y < 300) ? Phaser.Math.Between(300, 600) : Phaser.Math.Between(0, 300);
            child.setPosition(rand_x,rand_y);
            child.setVelocity(Phaser.Math.Between(-10, 10), Phaser.Math.Between(-8, 8));
            child.allowGravity = false;

        });
        // //  Input Events
        this.cursors = this.input.keyboard.createCursorKeys();

        // //  The score
        this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#4488aa' });


        // // Hit by meteor. Game over
        this.physics.add.collider(this.player, this.meteors, this.hitByMeteor, null, this);

        // this.physics.add.collider(laser, enemy, shoot)
        
        }

    update(ts, dt) {
        if (this.gameOver)
            {
                return;
            }

        laserDelay -= dt;
        if (this.cursors.space.isDown)
        {
            if (laserDelay > 0) {
                return
            }

            this.fireLaser()
        }

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

    // shootLaser() {
    //     lasers.setVelocityX(100)
    // }

    // laserHitsTarget(player, target) {
    //     //show explosion
    //     //target.disableBody(true,true)

    //     //If target == meteor:
    //     // score += 10

    //     //else:
    //     // score +=50
    // }

    hitByMeteor() {
        this.physics.pause();

        this.player.setTint(0xff0000);

        this.gameOver = true;
    }

    fireLaser() {
        const laser = this.laserGroup.getFirstDead();
        if (laser === undefined || laser === null) {
            return;
        }

        const x = this.player.x + 20;
        const y = this.player.y;
        laser.enableBody(true, x, y, true, true);
        laser.body.velocity.x += 300;

        laserDelay = laserInterval;
    }
}