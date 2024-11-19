import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'

export class GameScene extends Phaser.Scene {
    constructor() {
        super('playGame');
    }

    preload() {
        this.load.image('laser', '../assets/sprites/laser_rotated.png');
        this.load.spritesheet('spaceship', '../assets/sprites/Spaceship2_rotated.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('spaceship2', '../assets/sprites/Spaceship01-rotated.png', {frameWidth: 32, frameHeight: 48});
        this.load.spritesheet('asteroid', '../assets/sprites/Asteroid 01 - Explode.png', { frameWidth: 90, frameHeight: 90 });
        this.load.audio('laserShot', '../assets/sounds/laser.wav');
        this.load.audio('asteroidExplosion', '../assets/sounds/explosion.wav');
        this.load.audio('shipExplosion', '../assets/sounds/explosion12.wav');
    }

    create() {
        // Background
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'space')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)

        // Create players
        const isLeftPlayer = this.game.networkState.playerSide === 'left';
        this.localPlayer = this.add.sprite(
            isLeftPlayer ? 25 : this.scale.width - 25,
            300,
            isLeftPlayer ? 'spaceship' : 'spaceship2'
        );

        this.remotePlayer = this.add.sprite(
            !isLeftPlayer ? 25 : this.scale.width - 25,
            300,
            !isLeftPlayer ? 'spaceship' : 'spaceship2'
        );

        // Setup input handlers
        this.setupInputs();

        // Create score and timer text
        this.createUI();

        // Create animations
        this.createAnimations();
    }

    setupInputs() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    }

    createUI() {
        const style = { fontSize: '12px' };
        this.scoreP1Text = this.add.text(this.scale.width * .2, 20, 'SCORE: 0', style);
        this.scoreP2Text = this.add.text(this.scale.width * .75, 20, 'SCORE: 0', style);
        this.gameTimeText = this.add.text(this.scale.width / 2, 20, '', style);

        WebFontLoader.default.load({
            google: {
                families: ['Press Start 2P']
            },
            active: () => {
                this.scoreP1Text.setFontFamily('"Press Start 2P"').setColor('#ffffff');
                this.scoreP2Text.setFontFamily('"Press Start 2P"').setColor('#ffffff');
                this.gameTimeText.setFontFamily('"Press Start 2P"').setColor('#ffffff');
            }
        });
    }

    createAnimations() {
        this.anims.create({
            key: "degredation",
            frames: this.anims.generateFrameNumbers('asteroid', { start: 0, end: 1 }),
            frameRate: 30
        });

        this.anims.create({
            key: "explosion",
            frames: this.anims.generateFrameNumbers('asteroid', { start: 2, end: 6 }),
            frameRate: 30,
            repeat: 0,
            hideOnComplete: true
        });
    }

    handleInput() {
        if (!this.game.networkState.latestState) return;

        // Get local player state
        const playerState = this.game.networkState.latestState.players[this.game.networkState.playerId];
        if (!playerState.isActive) return;

        // Movement
        if (this.game.networkState.playerSide === 'left') {
            if (this.cursors.up.isDown) {
                this.game.socketHandler.sendPlayerMove('up');
            } else if (this.cursors.down.isDown) {
                this.game.socketHandler.sendPlayerMove('down');
            } else {
                this.game.socketHandler.sendPlayerMove('none');
            }

            if (this.cursors.space.isDown && playerState.laserDelay <= 0) {
                this.game.socketHandler.sendPlayerShoot();
                this.sound.play('laserShot', {
                    volume: .1,
                    rate: 2,
                    detune: -1000
                });
            }
        } else {
            if (this.keyW.isDown) {
                this.game.socketHandler.sendPlayerMove('up');
            } else if (this.keyS.isDown) {
                this.game.socketHandler.sendPlayerMove('down');
            } else {
                this.game.socketHandler.sendPlayerMove('none');
            }

            if (this.keyJ.isDown && playerState.laserDelay <= 0) {
                this.game.socketHandler.sendPlayerShoot();
                this.sound.play('laserShot', {
                    volume: .1,
                    rate: 2,
                    detune: -1000
                });
            }
        }
    }

    updateGameState(state) {
        if (!state) return;

        // Update players
        Object.entries(state.players).forEach(([id, playerData]) => {
            const sprite = id === this.game.networkState.playerId ? this.localPlayer : this.remotePlayer;
            sprite.x = playerData.x;
            sprite.y = playerData.y;
            sprite.visible = playerData.isActive;

            // Play ship explosion sound if player becomes inactive
            if (sprite.visible && !playerData.isActive) {
                this.sound.play('shipExplosion', {
                    volume: .3,
                    detune: 0
                });
            }
        });

        // Update scores
        Object.entries(state.players).forEach(([id, playerData]) => {
            if (playerData.side === 'left') {
                this.scoreP1Text.setText(`SCORE: ${playerData.score}`);
            } else {
                this.scoreP2Text.setText(`SCORE: ${playerData.score}`);
            }
        });

        // Update timer
        this.gameTimeText.setText(Math.round(state.gameTime / 1000));
    }

    update() {
        this.handleInput();
        this.updateGameState(this.game.networkState.latestState);

        // Check for game over
        if (this.game.networkState.latestState?.gameTime <= 0) {
            this.scene.start('endGame', {
                scoreP1: this.game.networkState.latestState.players['left']?.score || 0,
                scoreP2: this.game.networkState.latestState.players['right']?.score || 0
            });
        }
    }
}