import Phaser from '../../lib/phaser.js'

export class GameScene extends Phaser.Scene {
    constructor() {
        super('playGame');

    }

    preload() {
        this.load.image('laser', '../assets/sprites/laser_rotated.png');
        this.load.image('meteor', '../assets/sprites/Asteroids.png');
        this.load.spritesheet('spaceship', '../assets/sprites/Spaceship2_rotated.png', { frameWidth: 32, frameHeight: 48 });

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

        
        // // The player and its settings
        this.player = this.physics.add.sprite(100, 450, 'spaceship');
        this.player.setCollideWorldBounds(true);

        // //  Animations


        // // Lasers
        // lasers = this.physics.add.group({
        //     key: 'laser',
        //     setXY: {x: player.x, y: player.y},
        // });


        // // Generate meteors
        let meteors = this.physics.add.group({
            key: 'meteor',
            repeat: 50
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

    hitByMeteor() {
        this.physics.pause();

        this.player.setTint(0xff0000);

        this.gameOver = true;
    }
}