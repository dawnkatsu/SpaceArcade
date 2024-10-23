class MenuScene extends Phaser.Scene {
    constructor() {
        super("bootGame")
    }

    preload() {
        this.load.image('space', "../assets/backgrounds/Space.png")
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    }

    create() {
        this.add.image(400,300,'space')
        this.add.text(225,150,"Space Arcade", {fontSize: 50})
        this.add.text(310,350, "Player vs Player", {fontSize: 20})
        this.add.text(295,380, "Player vs Computer", {fontSize: 20})

        this.input.keyboard.on('keydown-ENTER', function() {
            this.scene.start('playGame')
        }, this)
    }
}