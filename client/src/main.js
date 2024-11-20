import Phaser from '../lib/phaser.js'
import { MenuScene } from './scenes/MenuScene.js'
import { GameScene } from './scenes/GameScene.js'
import { EndScene } from './scenes/EndScene.js'
import { WaitingRoomScene } from './scenes/WaitingRoomScene.js'
import socketHandler from './SocketHandler.js' 

const config = {
    width: 800,
    height: 600,
    dom: {
        createContainer: true  // This is crucial for DOM elements
    },
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
        WaitingRoomScene,
        GameScene,
        EndScene,
    ]
}
// Create the game instance
const game = new Phaser.Game(config)

// Add socket handler to the game instance
game.socketHandler = socketHandler

// Export the game instance for access from scenes
export default game;