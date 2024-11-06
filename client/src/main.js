import Phaser from '../lib/phaser.js'
import { MenuScene } from './scenes/MenuScene.js'
import { GameScene } from './scenes/GameScene.js'
import { EndScene } from './scenes/endScene.js'

const config = {
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    roundPixels: true,
    pixelArt: true,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
    scene: [
        MenuScene,
        GameScene,
        EndScene,
    ]
}
const game = new Phaser.Game(config)