window.onload=function() {
    var config = {
        width: 800,
        height: 600,
        background: 0x000000,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }},
        scene: [MenuScene, GameScene]
    }

    var game = new Phaser.Game(config)
}