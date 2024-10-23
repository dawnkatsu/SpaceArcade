import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'

export class MenuScene extends Phaser.Scene {
    constructor() {
        super("bootGame")
    }

    preload() {
        this.load.image('space', "../assets/backgrounds/Space01.png")
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
    }

    update() {
        this.input.keyboard.on('keydown-ENTER', function() {
            this.scene.start('playGame')
        }, this)
    }
}