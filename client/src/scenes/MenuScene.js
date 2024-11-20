import Phaser from '../../lib/phaser.js'
import * as WebFontLoader from '../../lib/webfontloader.js'
import { CURRENT_SETTINGS } from '../settings.js';

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
        this.menuItems = null;
        this.inputFields = {};
        this.actionButton = null;
        this.socketListeners = []; 
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
        //console.log('MenuScene: preload completed');        
    }

    /**
     * Creates and scales the background image to fit the screen
     * @returns {Phaser.GameObjects.Image} The background image object
     */
    createBackground() {
        // console.log('MenuScene: creating background');
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
        const menuItem = this.add.text(x, y, text, {
            fontSize: this.menuConfig.fontSize.menuItem
        }).setOrigin(0.5)
        // console.log(`Created menu item: ${text} at ${x},${y}`);
        return menuItem
    }

    createInputField(x, y, placeholder) {
        // console.log(`Creating input field at ${x},${y} with placeholder: ${placeholder}`);
        const inputField = document.createElement('input');
        inputField.style.fontFamily = this.menuConfig.fontFamily;
        inputField.style.fontSize = `${this.menuConfig.fontSize.input}px`;
        inputField.style.padding = '8px';
        inputField.style.width = '200px';
        inputField.style.textAlign = 'center';
        inputField.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        inputField.style.color = '#ffffff';
        inputField.style.border = '2px solid #ffffff';
        inputField.placeholder = placeholder;

        const domElement = this.add.dom(x, y, inputField);
        // console.log('DOM element created:', domElement);
        return domElement;
    }

    showCreateGameForm() {
        // Hide menu items
        Object.values(this.menuItems).forEach(menuItem => menuItem.setVisible(false));
        
        // Show username input
        this.inputFields.username.setVisible(true);
        this.inputFields.gameId?.setVisible(false);  // Hide game ID if it exists
        
        // Show and setup action button
        this.actionButton.setText("CREATE")
            .setVisible(true)
            .setInteractive({ useHandCursor: true });
    }

    showJoinGameForm() {
        // Hide menu items
        Object.values(this.menuItems).forEach(menuItem => menuItem.setVisible(false));
        
        // Show both inputs
        this.inputFields.username.setVisible(true);
        this.inputFields.gameId.setVisible(true);
        
        // Show and setup action button
        this.actionButton.setText("JOIN")
            .setVisible(true)
            .setInteractive({ useHandCursor: true });
    }

    setupSocketListeners() {
        // Clear any existing listeners
        this.socketListeners.forEach(listener => {
            this.game.socketHandler.off(listener.event, listener.callback);
        });
        this.socketListeners = [];

        // Setup new listeners
        const addListener = (event, callback) => {
            this.game.socketHandler.on(event, callback);
            this.socketListeners.push({ event, callback });
        };

        addListener('gameCreated', (data) => {
            console.log('Game created:', data);
            this.scene.start('waitingRoom', {
                gameId: data.game_id,
                username: data.username
            });
        });

        addListener('gameJoined', (data) => {
            console.log('Game joined:', data);
            this.scene.start('playGame', {
                gameId: data.game_id,
                username: data.username
            });
        });

        addListener('joinError', (data) => {
            console.error('Join error:', data.message);
            // You might want to show this error to the user
        });
    }

    /**
     * Creates and initializes all menu elements
     */
    create() {
        // console.log('MenuScene: create started');
        const centerX = this.scale.width / 2;

        this.createBackground();
        const music = this.setupAudioSystem();
        this.createMuteControls(music);

        // Create title
        const title = this.add.text(
            centerX,
            this.menuConfig.menuOffset.title,
            "SPACE ARCADE",
            { fontSize: this.menuConfig.fontSize.title }
        ).setOrigin(0.5)
        // console.log('MenuScene: title created');

        // Create menu items
        this.menuItems = {
            create: this.createMenuItem(centerX, this.menuConfig.menuOffset.firstOption, "Create Game"),
            join: this.createMenuItem(centerX, this.menuConfig.menuOffset.firstOption + this.menuConfig.menuOffset.spacing, "Join Game"),
            pvc: this.createMenuItem(centerX, this.menuConfig.menuOffset.firstOption + this.menuConfig.menuOffset.spacing * 2, "Player vs Computer")
        }

        // Create input fields
        this.inputFields = {
            username: this.createInputField(
                centerX,
                this.menuConfig.menuOffset.firstOption + this.menuConfig.menuOffset.spacing,
                "Enter Username"
            ),
            gameId: this.createInputField(
                centerX,
                this.menuConfig.menuOffset.firstOption + this.menuConfig.menuOffset.spacing * 2,
                "Enter Game ID"
            )
        };

        // Hide input fields initially
        Object.values(this.inputFields).forEach(field => field.setVisible(false));

        // Create action button
        this.actionButton = this.add.text(
            centerX,
            this.menuConfig.menuOffset.firstOption + this.menuConfig.menuOffset.spacing * 3,
            "",
            { fontSize: this.menuConfig.fontSize.menuItem }
        ).setOrigin(0.5).setVisible(false);

        // Hover sprite
        const hoverSprite = this.add.image(100, 100, 'ship').setScale(1).setVisible(false)
        // console.log('Created hover sprite');

        // Setup menu item interactivity
        Object.entries(this.menuItems).forEach(([key, item]) => {
            item.setInteractive({ useHandCursor: true });
            
            item.on('pointerover', () => {
                item.setColor('#ffff00');
                hoverSprite.setVisible(true);
                hoverSprite.setPosition(item.x - item.width/2 - 40, item.y);
            });

            item.on('pointerout', () => {
                item.setColor(this.menuConfig.color);
                hoverSprite.setVisible(false);
            });

            item.on('pointerdown', () => {
                // console.log(`Clicked ${key}`);
                if (key === 'create') {
                    this.showCreateGameForm();
                } else if (key === 'join') {
                    this.showJoinGameForm();
                } else if (key === 'pvc') {
                    CURRENT_SETTINGS.isSinglePlayer = true;
                    this.scene.start('playGame');
                }
            });
        })

        // Setup action button
        this.actionButton.on('pointerdown', () => {
            const username = this.inputFields.username.node.value;
            
            if (this.actionButton.text === "CREATE") {
                if (username) {
                    console.log('Creating game with username:', username);
                    this.game.socketHandler.createGame(username);
                }
            } else if (this.actionButton.text === "JOIN") {
                const gameId = this.inputFields.gameId.node.value;
                if (username && gameId) {
                    console.log('Joining game:', gameId, 'with username:', username);
                    this.game.socketHandler.joinGame(gameId.toUpperCase(), username);
                }
            }
        });

        // Setup socket listeners
        this.setupSocketListeners();

        /// Load font
        WebFontLoader.default.load({
            google: {
                families: [this.menuConfig.fontFamily]
            },
            active: () => {
                // console.log('Font loaded successfully');
                const elements = [title, ...Object.values(this.menuItems), this.actionButton];
                elements.forEach(element => {
                    element.setFontFamily(`"${this.menuConfig.fontFamily}"`);
                    element.setColor(this.menuConfig.color);
                });
            }
        });
    }

    shutdown() {
        // Clean up socket listeners when scene shuts down
        this.socketListeners.forEach(listener => {

            this.game.socketHandler.off(listener.event, listener.callback);
        });
    }
}