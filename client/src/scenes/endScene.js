import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'
import { MenuScene } from './MenuScene.js';
import { GameScene } from './GameScene.js';
import { CURRENT_SETTINGS } from '../settings.js';

export class EndScene extends Phaser.Scene {
    constructor() {
        super('endGame')
    }

    init(data) {
        this.scoreP1 = data.scoreP1;
        this.scoreP2 = data.scoreP2;
    }

    create() {
        // Add background
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'space')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)

        // Add scores
        this.gameOverText = this.add.text(this.scale.width / 2, 150, `GAME OVER`, { fontSize: '30px'}).setOrigin(.5);
        this.scoreP1Text = this.add.text(this.scale.width / 2, 300, `P1 SCORE: ${this.scoreP1}`, { fontSize: '20px'}).setOrigin(.5);
        this.scoreP2Text = this.add.text(this.scale.width / 2, 350, `P2 SCORE: ${this.scoreP2}`, { fontSize: '20px'}).setOrigin(.5);

        WebFontLoader.default.load({
            google: {
                families: ['Press Start 2P']
            },
            active: () => {
                this.scoreP1Text.setFontFamily('"Press Start 2P"').setColor('#ffffff');
                this.scoreP2Text.setFontFamily('"Press Start 2P"').setColor('#ffffff');
                this.gameOverText.setFontFamily('"Press Start 2P"').setColor('#ffffff');

            }
        })
    }

    update() {
        this.time.delayedCall(10000, this.backToMain, [], this);
    }

    backToMain() {
        console.log('back to main menu...')
        this.scene.start('bootGame');
    }
}
