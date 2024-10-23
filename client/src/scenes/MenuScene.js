import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'

export class MenuScene extends Phaser.Scene {
    constructor() {
        super("bootGame")
    }

    preload() {
        this.load.image('space', "../assets/backgrounds/Space01.png")
        this.load.image('ship', "../assets/sprites/Spaceship01.png")
    }

    create() {
        // Get center of game screen
        const w = this.scale.width / 2;

        // Add background image
        this.add.image(400, 300, 'space');
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'space')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)

        // Add title
        const title = this.add
        .text(w,150,"SPACE ARCADE", {fontSize: 40}).setOrigin(.5)

        // Add Player vs Player option
        const pvp = this.add
        .text(w,350, "Player vs Player", {fontSize: 15}).setOrigin(.5)

        // Add Player vs Computer option
        const pvc = this.add
        .text(w,400, "Player vs Computer", {fontSize: 15}).setOrigin(.5)

        // Load Google font; wait for assets to load and set font
        WebFontLoader.default.load({
            google: {
                families: ['Press Start 2P']
            },
            active: () => {
                title.setFontFamily('"Press Start 2P"').setColor('#ffffff');
                pvp.setFontFamily('"Press Start 2P"').setColor('#ffffff');
                pvc.setFontFamily('"Press Start 2P"').setColor('#ffffff');
            }
        })

        // Add sprite to indicate menu selection
        let hoverSprite = this.add.image(100,100,'ship')
        hoverSprite.setScale(1);
        hoverSprite.setVisible(false);


        // Add interactivity on hover for menu selection
        // Player vs Player
        pvp.setInteractive();
        pvp.on('pointerover', () => {
            console.log('pvp hover')
            hoverSprite.setVisible(true);
            hoverSprite.x = pvp.x - pvp.width/2 - 40;
            hoverSprite.y = pvp.y;
        })
        pvp.on('pointerout', () => {
            console.log('pvp out')
            hoverSprite.setVisible(false);
        })

        pvp.on('pointerdown', () => {
            this.scene.start('playGame')
        })

        // Player vs Computer
        pvc.setInteractive();

        pvc.on('pointerover', () => {
            hoverSprite.setVisible(true);
            hoverSprite.x = pvc.x - pvc.width/2 - 40;
            hoverSprite.y = pvc.y;
            console.log('pvc hover')
        })

        pvc.on('pointerout', () => {
            hoverSprite.setVisible(false);
            console.log('pvc out')
        })

        pvc.on('pointerdown', () => {
            this.scene.start('playGame')
        })
    }

    update() {       
    }
}