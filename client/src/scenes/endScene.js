import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'
import { MenuScene } from './MenuScene.js';
import { GameScene } from './GameScene.js';
import { CURRENT_SETTINGS } from '../settings.js';


/**
 * EndScene class represents the end scene of the game where
 * game results are displayed. This scene is triggered after
 * the game timer expires.
 * @extends Phaser.Scene
 */
export class EndScene extends Phaser.Scene {
    constructor() {
        super('endGame')
    }

    /**
     * Stores data received from GameScene.js: scoreP1, scoreP2
     * @param {integer} data - player1 and player2 scores
     */
    init(data) {
        this.scoreP1 = data.scoreP1;
        this.scoreP2 = data.scoreP2;
    }

    /**
     * Creates and initializes all end scene elements
     */
    create() {
        // Add background
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'space')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)

        // Add scores
        this.displayWinner();
        this.scoreP1Text = this.add.text(this.scale.width / 2, 300, `P1 SCORE: ${this.scoreP1}`, { fontSize: '20px'}).setOrigin(.5);
        this.scoreP2Text = this.add.text(this.scale.width / 2, 350, `P2 SCORE: ${this.scoreP2}`, { fontSize: '20px'}).setOrigin(.5);

        // Single font loading call for all text elements
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

    /**
     * Starts a delayed call within Phaser's constant update( ) function
     * to display game results for a set amount of time before 
     * returning to MenuScene.
     */
    update() {
        this.time.delayedCall(CURRENT_SETTINGS.endSceneDuration, this.backToMain, [], this);
    }

    /**
     * Determines the winner and displays corresponding text by comparing
     * scoreP1 and scoreP2
     */
    displayWinner() {
        if (this.scoreP1 > this.scoreP2) {
            this.gameOverText = this.add.text(this.scale.width / 2, 150, `PLAYER 1 WINS!`, { fontSize: '30px'}).setOrigin(.5);
        }

        else if (this.scoreP2 > this.scoreP1) {
            this.gameOverText = this.add.text(this.scale.width / 2, 150, `PLAYER 2 WINS!`, { fontSize: '30px'}).setOrigin(.5);
        }
        else {
            this.gameOverText = this.add.text(this.scale.width / 2, 150, `IT'S A TIE!`, { fontSize: '30px'}).setOrigin(.5);

        }
    }

    /**
     * Ends the EndScene and returns to MenuScene. 
     * Resets the isSinglePlayer flag.
     */
    backToMain() {
        //console.log('back to main menu...')
        CURRENT_SETTINGS.isSinglePlayer = false;
        this.scene.start('bootGame');
    }
}
