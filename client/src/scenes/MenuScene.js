import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'

/**
 * MenuScene class represents the main menu of the game.
 * Handles the initial game menu interface including background, music controls,
 * and menu options for different game modes.
 * @extends Phaser.Scene
 */

export class MenuScene extends Phaser.Scene {
    constructor() {
        super("bootGame")
        this.menuConfig = {
            fontFamily: 'Press Start 2P',
            fontSize: {
                title: 40,
                menuItem: 15
            },
            color: '#ffffff',
            menuOffset: {
                title: 150,
                firstOption: 350,
                spacing: 50
            }
        }
    }

    /**
     * Preloads all assets required for the menu scene
     * Including images for background, ship sprite, and audio controls
     */
    preload() {
        this.load.image('space', "../assets/backgrounds/Space01.png")
        this.load.image('ship', "../assets/sprites/Spaceship01.png")
        this.load.audio('music', "../assets/sounds/menu.wav")
        this.load.image('sound-on', "../assets/sprites/Speaker-0.png")
        this.load.image('sound-off', "../assets/sprites/Speaker-Crossed.png")        
    }

    /**
     * Creates and scales the background image to fit the screen
     * @returns {Phaser.GameObjects.Image} The background image object
     */
    createBackground() {
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'space')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)
    }

    /**
     * Initializes and configures the background music
     * @returns {Phaser.Sound.BaseSound} The configured music object
     */
    setupAudioSystem() {
        var music = this.sound.add('music', {
            volume: .2
        });
        music.loop = true;
        music.play();
        return music;
    }

    /**
     * Creates and positions the mute/unmute control buttons
     * @param {Phaser.Sound.BaseSound} music - The music object to control
     * @returns {Object} Object containing sound and mute button references
     */
    createMuteControls(music) {
        let sound = this.add.image(this.scale.width - 50, 50, 'sound-on').setScale(.4);
        let mute = this.add.image(this.scale.width - 50, 50, 'sound-off').setScale(.4);
        mute.setVisible(false);

        this.setupMuteInteractivity(sound, mute, music);
        return { sound, mute };
    }

    /**
     * Sets up interactive behavior for mute/unmute buttons
     * @param {Phaser.GameObjects.Image} sound - The unmuted speaker button
     * @param {Phaser.GameObjects.Image} mute - The muted speaker button
     * @param {Phaser.Sound.BaseSound} music - The music object to control
     */
    setupMuteInteractivity(sound, mute, music) {
        sound.setInteractive();
        mute.setInteractive();

        sound.on('pointerdown', () => {
            music.setMute(true);
            sound.setVisible(false);
            mute.setVisible(true);
        });

        mute.on('pointerdown', () => {
            music.setMute(false);
            sound.setVisible(true);
            mute.setVisible(false);
        });
    }

    /**
     * Creates and configures a menu text item
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} text - Text content
     * @returns {Phaser.GameObjects.Text} The created text object
     */
    createMenuItem(x, y, text) {
        return this.add.text(x, y, text, {
            fontSize: this.menuConfig.fontSize.menuItem
        }).setOrigin(0.5)
    }

    /**
     * Sets up hover behavior for menu items
     * @param {Phaser.GameObjects.Text} menuItem - The menu text to make interactive
     * @param {Phaser.GameObjects.Image} hoverSprite - The sprite to show on hover
     */
    setupMenuItemInteractivity(menuItem, hoverSprite) {
        menuItem.setInteractive()
        
        menuItem.on('pointerover', () => {
            hoverSprite.setVisible(true)
            hoverSprite.setPosition(
                menuItem.x - menuItem.width/2 - 40,
                menuItem.y
            )
        })

        menuItem.on('pointerout', () => {
            hoverSprite.setVisible(false)
        })

        menuItem.on('pointerdown', () => {
            this.scene.start('playGame')
        })
    }

    /**
     * Creates and initializes all menu elements
     */
    create() {
        const centerX = this.scale.width / 2;

        this.createBackground();
        const music = this.setupAudioSystem();
        this.createMuteControls(music);

        // Create menu elements
        const title = this.add.text(
            centerX,
            this.menuConfig.menuOffset.title,
            "SPACE ARCADE",
            { fontSize: this.menuConfig.fontSize.title }
        ).setOrigin(0.5)

        const menuItems = {
            pvp: this.createMenuItem(centerX, this.menuConfig.menuOffset.firstOption, "Player vs Player"),
            pvc: this.createMenuItem(centerX, this.menuConfig.menuOffset.firstOption + this.menuConfig.menuOffset.spacing, "Player vs Computer")
        }

        // Load Google font; wait for assets to load and set font
        WebFontLoader.default.load({
            google: {
                families: [this.menuConfig.fontFamily]
            },
            active: () => {
                const elements = [title, menuItems.pvp, menuItems.pvc]
                elements.forEach(element => {
                    element.setFontFamily(`"${this.menuConfig.fontFamily}"`)
                        .setColor(this.menuConfig.color)
                })
            }
        })

        // Add sprite to indicate menu selection
        const hoverSprite = this.add.image(100, 100, 'ship')
            .setScale(1)
            .setVisible(false)

        // Setup interactivity
        Object.values(menuItems).forEach(item => {
            this.setupMenuItemInteractivity(item, hoverSprite)
        })
    }

    update() {       
    }
}