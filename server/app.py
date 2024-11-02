"""
app.py
------
Main Flask application for the Space Battle Multiplayer Game.

This file sets up the Flask server, handles WebSocket connections,
manages game creation and joining, and coordinates communication
between clients.

Author: Una Lee
Date: 10/31/2024
Version: 1.0
"""

from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fallback_secret_key') # We will not be actively using this with Flask-SocketIO but are including it to align with Flask best practices for potential future expansion. 
socketio = SocketIO(app)

# Game state management
games = {}

@app.route('/')
def index():
    """
    Render the main page of the application.
    
    :return: Rendered HTML template
    """
    return render_template('index.html')

def generate_game_id():
    """Generate a short, unique game ID."""
    while True:
        game_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        if game_id not in games:
            return game_id

@socketio.on('connect')
def handle_connect():
    """
    Handle a new client connection.
    """
    print(f"Client connected: {request.sid}")
    # Initialize player session data
    session['username'] = None
    session['game_id'] = None
    # Emit welcome message and server info
    emit('connection_established', {
        'message': 'Connected to server',
        'player_id': request.sid
    })

@socketio.on('disconnect')
def handle_disconnect():
    """
    Handle a client disconnection.
    """
    print(f"Client disconnected: {request.sid}")
    game_id = session.get('game_id')

    if game_id and game_id in games:
        game = games[game_id]
        if request.sid in game.players:
            # Remove player from game
            leave_room(game_id)
            del game.players[request.sid]
            
            # End the game if less than 2 players
            if len(game.players) < 2:
                if len(game.players) == 1:
                    remaining_player = next(iter(game.players.values()))
                    emit('game_ended', {
                        'reason': 'disconnection',
                        'winner': remaining_player['username']
                    }, room=game_id)
                del games[game_id]
            else:
                # Update game state if the game is still ongoing
                game.handle_player_disconnect(request.sid)
                emit('game_state', game.get_state(), room=game_id)

    # Clear session data
    session.clear()         

@socketio.on('create_game')
def handle_create_game(username):
    """
    Handle a request to create a new game.
    
    :param username: str - The username of the player creating the game
    :emit: 'game_created' event with game details or 'game_creation_error' if input is invalid
    """
    if not isinstance(username, str) or not username:
        emit('game_creation_error', {'message': 'Invalid input: username must be a non-empty string'})
        return
    
    game_id = generate_game_id()
    games[game_id] = GameState()
    join_room(game_id)
    games[game_id].add_player(request.sid, username)
    session['game_id'] = game_id
    session['username'] = username
    
    emit('game_created', {
        'game_id': game_id,
        'username': username,
        'player_side': 'left'
    })
    print(f"Game created: {game_id} by player: {username}")

@socketio.on('join_game')
def handle_join_game(data):
    """
    Handle a request to join an existing game.
    
    Expected data:
    {
        'game_id': str,  # The ID of the game to join
        'username': str  # The username of the player joining the game
    }
    
    :param data: Dictionary containing game join data
    :emit: 'game_joined' event with game details, 'game_start' event to both players if game is full,
           or 'join_error' if input is invalid or game cannot be joined
    """
    if not isinstance(data, dict) or 'game_id' not in data or 'username' not in data:
        emit('join_error', {'message': 'Invalid input: expected a dictionary with game_id and username'})
        return
    
    game_id = data['game_id']
    username = data['username']
    
    if game_id not in games:
        emit('join_error', {'message': 'Game not found'})
        return
    
    game = games[game_id]
    if len(game.players) >= 2:
        emit('join_error', {'message': 'Game is full'})
        return
    
    join_room(game_id)
    game.add_player(request.sid, username)
    session['game_id'] = game_id
    session['username'] = username
    
    emit('game_joined', {
        'game_id': game_id,
        'username': username,
        'player_side': 'right'
    })
    emit('player_joined', {'username': username}, room=game_id, include_self=False)
    
    if len(game.players) == 2:
        emit('game_start', room=game_id)
        socketio.start_background_task(game_loop, game_id)
    
    print(f"Player {username} joined game: {game_id}")

@socketio.on('cancel_game')
def handle_cancel_game(game_id):
    if game_id in games:
        del games[game_id]
        leave_room(game_id)
        emit('game_cancelled', room=game_id)
        print(f"Game cancelled: {game_id}")

@socketio.on('player_move')
def handle_player_move(y):
    """
    Handle a player movement update.
    
    :param y: int - The new vertical position of the player
    """
    if not isinstance(y, (int, float)):
        return  # Silently ignore invalid input
    
    game_id = session.get('game_id')
    if game_id in games:
        games[game_id].update_player_position(request.sid, y)

@socketio.on('player_shoot')
def handle_player_shoot():
    """
    Handle a player shoot action.
    """
    game_id = session.get('game_id')
    if game_id in games:
        games[game_id].player_shoot(request.sid)

def game_loop(game_id):
    """
    Main game loop for updating and broadcasting game state.
    
    :param game_id: Unique identifier for the game
    """
    while game_id in games and len(games[game_id].players) == 2:
        # Use functions from server/game_logic.py to update game state, check collisions, etc.
        emit('game_state', games[game_id].get_state(), room=game_id)
        socketio.sleep(1/60)  # 60 FPS

if __name__ == '__main__':
    socketio.run(app, debug=True)