class GameState:
    def __init__(self):
        self.players = {}  # Dict to store player information
        self.game_started = False

    def add_player(self, player_id, username):
        """Add a player to the game"""
        side = 'left' if len(self.players) == 0 else 'right'
        self.players[player_id] = {
            'username': username,
            'side': side,
            'position': 300,  # Middle of screen (assuming 600 height)
        }
        return side

    def remove_player(self, player_id):
        """Remove a player from the game"""
        if player_id in self.players:
            del self.players[player_id]

    def get_state(self):
        """Get the current game state"""
        return {
            'players': self.players,
            'game_started': self.game_started
        }

    def handle_player_disconnect(self, player_id):
        """Handle a player disconnection"""
        self.remove_player(player_id)
        self.game_started = False

    def update_player_position(self, player_id, y):
        """Update a player's position"""
        if player_id in self.players:
            self.players[player_id]['position'] = y

    def player_shoot(self, player_id):
        """Handle player shoot action"""
        # Placeholder for shooting mechanism
        pass