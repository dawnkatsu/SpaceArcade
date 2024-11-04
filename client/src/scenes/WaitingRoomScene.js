import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'

export class WaitingRoomScene extends Phaser.Scene {
    constructor() {
        super("waitingRoom")
        this.menuConfig = {
            fontFamily: 'Press Start 2P',
            fontSize: {
                title: 40,
                text: 20,
                gameId: 30
            },
            color: '#ffffff',
            menuOffset: {
                title: 150,
                gameId: 300,
                text: 400
            }
        }
        this.textElements = []
    }

    init(data) {
        this.gameId = data.gameId
        this.username = data.username
    }

    preload() {
        this.load.image('space', "../assets/backgrounds/Space01.png")
    }

    createBackground() {
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'space')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)
    }

    create() {
        const centerX = this.scale.width / 2

        this.createBackground()

        // Create all text elements
        const title = this.add.text(
            centerX,
            this.menuConfig.menuOffset.title,
            "WAITING ROOM",
            { fontSize: this.menuConfig.fontSize.title }
        ).setOrigin(0.5)
        this.textElements.push(title)

        const gameIdText = this.add.text(
            centerX,
            this.menuConfig.menuOffset.gameId,
            `GAME ID: ${this.gameId}`,
            { fontSize: this.menuConfig.fontSize.gameId }
        ).setOrigin(0.5)
        this.textElements.push(gameIdText)

        const waitingText = this.add.text(
            centerX,
            this.menuConfig.menuOffset.text,
            'Waiting for player to join...',
            { fontSize: this.menuConfig.fontSize.text }
        ).setOrigin(0.5)
        this.textElements.push(waitingText)

        const cancelText = this.add.text(
            centerX,
            this.menuConfig.menuOffset.text + 100,
            'CANCEL',
            { fontSize: this.menuConfig.fontSize.text }
        ).setOrigin(0.5)
        this.textElements.push(cancelText)

        // Make cancel button interactive
        cancelText.setInteractive({ useHandCursor: true })
            .on('pointerover', () => cancelText.setColor('#ffff00'))
            .on('pointerout', () => cancelText.setColor(this.menuConfig.color))
            .on('pointerdown', () => {
                // Cancel the game on the server
                this.game.socketHandler.socket.emit('cancel_game', this.gameId);
                // Return to menu scene
                this.scene.start('bootGame');
            });

        // Single font loading call for all text elements
        WebFontLoader.default.load({
            google: {
                families: [this.menuConfig.fontFamily]
            },
            active: () => {
                this.textElements.forEach(element => {
                    element.setFontFamily(`"${this.menuConfig.fontFamily}"`).setColor(this.menuConfig.color)
                })
            }
        })

        // Setup socket event listener for when second player joins
        this.game.socketHandler.on('gameStart', () => {
            this.scene.start('playGame', {
                gameId: this.gameId,
                username: this.username
            })
        })
    }
}