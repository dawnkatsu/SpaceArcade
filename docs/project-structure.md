# Space Arcade Game Project Structure

## Directory Overview
The project is organized into several main directories, each serving a specific purpose in the game's architecture.

### Root Directory
```
space-combat/
├── client/          # Frontend game files
├── server/          # Backend Python/Flask server
├── assets/          # Game assets and resources
└── docs/        # Project documentation
```

## Client Directory Structure
Primary directory containing all frontend game code, assets, and resources. This includes the Phaser game implementation, UI components, and client-side networking code.

```
client/
├── index.html       # Main entry point
├── styles/
│   └── main.css     # Global styles
├── src/
│   ├── main.js      # Game initialization
│   ├── config.js    # Game configuration
│   ├── socket_handler.js    # Client-server communication
│   ├── scenes/      # Phaser scene files
│   │   ├── MenuScene.js
│   │   ├── WaitingRoomScene.js
│   │   └── GameScene.js
|   │   └── EndScene.js
│   ├── sprites/     # Game object classes
│   │   ├── Player.js
│   │   ├── Asteroid.js
│   │   └── Projectile.js
└── assets/          # Client-side assets
    ├── sprites/
    ├── audio/
    ├── fonts/
    └── backgrounds/
```

## Client File Descriptions

### Main Files
* index.html - Primary entry point for the game application:
    * Loads necessary scripts (Phaser, Socket.IO)
    * Sets up the game container
    * Includes CSS and other dependencies
* styles/main.css - Global stylesheet
* src/main.js - Game initialization and configuration:
    * Creates Phaser game instance
    * Sets up game configuration 
    * Manages scene loading and transitions
    * Initializes connection to server
* src/config.js - Game configuration constants:
    * Screen dimensions and scaling
    * Physics parameters
    * Player movement speeds
    * Shooting cooldowns
* src/socket_handler.js - Handles WebSocket communication between the client and server. Manages all socket events including:
    * Game creation
    * Joining a game
    * Player actions
    * Game state updates

### Scene Files
* scenes/MenuScene.js - Main menu implementation:
    * Start game button
    * Join game button with field to enter game ID
    * Leaderboard button
* scenes/WaitingRoomScene.js - Multiplayer waiting room:
    * Display game ID
    * Cancel button
* scenes/GameScene.js - Core gameplay scene:
    * Game world setup
    * Player spawning
    * Asteroid generation
    * Collision detection
    * Score tracking
    * Real-time multiplayer sync
* scenes/EndScene.js - End game screen:
    * Final scores display
    * Winner announcement
    * Return to menu

### Sprite Classes
* sprites/Player.js - Player ship implementation:
    * Movement controls
    * Shooting mechanics
    * Collision handling
    * Visual effects
    * Network position updates
* sprites/Asteroid.js - Asteroid object implementation:
    * Movement patterns
    * Size variations
    * Collision detection
    * Health/damage system
* sprites/Projectile.js - Projectile system:
    * Movement physics
    * Collision detection
    * Damage calculations
    * Visual effects
    * Cleanup handling

## Server Directory Structure
Contains all backend logic including the Flask server, game state management, and multiplayer synchronization code.
```
server/
├── app.py          # Main Flask application
├── requirements.txt # Python dependencies
├── config.py       # Server configuration
└── game_logic.py           # Game server logic
```

## Server File Descriptions

* app.py - Main Flask application:
    * Sets up Flask server
    * Handles WebSocket connections
    * Manages game creation and joining
    * Coordinates communication between clients
* requirements.txt - Python package dependencies
* config.py - Server configuration:
    * Server settings
    * Game constants
* game_logic.py - Game state management:
    * Physics calculations
    * Game state updates
    * Player action validation
    * Collision detection
    * Score tracking