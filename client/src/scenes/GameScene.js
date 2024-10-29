import Phaser from '../../lib/phaser.js'

export class GameScene extends Phaser.Scene {
    constructor() {
        super('playGame');

    }

    preload() {
        this.load.image('laser', '../assets/sprites/laser_rotated.png');
        this.load.image('meteor', '../assets/sprites/Asteroids.png');
        this.load.spritesheet('spaceship', '../assets/sprites/Spaceship2_rotated.png', { frameWidth: 24, frameHeight: 24 });
        this.load.spritesheet('asteroid', '../assets/sprites/Asteroid 01 - Explode.png', { frameWidth: 90, frameHeight: 90, frame: 0 });

    }

    create() {
        // Calibrations
        const asteroids_x_vel_min = -5;
        const asteroids_x_vel_max = 5;
        const asteroids_y_vel_min = -5;
        const asteroids_y_vel_max = 5;
        const asteroids_x_coverage = 200;
        const num_asteroids = 50;
        const asteroids_frame_rate = 30;

        // Init
        this.gameOver = false;

        //  A simple background for our game
        this.add.image(400, 300, 'space');
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'space')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)

        
        // The player and its settings
        this.player = this.physics.add.sprite(100, 450, 'spaceship');
        this.player.setCollideWorldBounds(true);

        //  Animations
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

        // // Lasers
        // lasers = this.physics.add.group({
        //     key: 'laser',
        //     setXY: {x: player.x, y: player.y},
        // });


        // Generate meteors
        this.meteors = this.physics.add.group({
            key: 'asteroid',
            repeat: num_asteroids
        });

        this.meteors.children.iterate(function (child) {
            var rand_x = Phaser.Math.Between(400 - asteroids_x_coverage, 400 + asteroids_x_coverage);
            var rand_y = Phaser.Math.Between(0, 600);

            child.setPosition(rand_x,rand_y);
            child.setVelocity(Phaser.Math.Between(asteroids_x_vel_min, asteroids_x_vel_max), Phaser.Math.Between(asteroids_y_vel_min, asteroids_y_vel_max));
            child.allowGravity = false;
        });

        //  Input Events
        this.cursors = this.input.keyboard.createCursorKeys();

        //  The score
        this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#4488aa' });


        // Hit by meteor. Game over
        this.physics.add.collider(this.player, this.meteors, this.hitByMeteor, null, this);

        // Hit meteor with laser
        // this.physics.add.collider(laser, enemy, shoot)
        
        }

    update() {
        if (this.gameOver)
            {
                return;
            }
        if (this.cursors.space.isDown)
        {
            // shootLaser();
    
        }
        if (this.cursors.up.isDown)
        {
            this.player.setVelocityY(-160);
    
        }
        else if (this.cursors.down.isDown)
        {
            this.player.setVelocityY(160);
    
        }
        else if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-160);
    
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(160);
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

    hitByMeteor(player,meteor) {
        
        // Ship and meteor explodes
        meteor.play("explosion")
        player.play("explosion")
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.gameOver = true;
        
    }

    destroyMeteor(player,meteor) {
        console.log(meteor.anims.currentFrame)
        if (meteor.anims.currentFrame != null) {
            meteor.play("explosion")
        }
        else {
            meteor.play("degredation")
            
        }
    }
}