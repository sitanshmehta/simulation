from flask import Flask
from flask_socketio import SocketIO, emit
import numpy as np

app = Flask(__name__)
socketio = SocketIO(app)

# Initialize fluid simulation state
grid_size = 100
velocity_x = np.zeros((grid_size, grid_size))
velocity_y = np.zeros((grid_size, grid_size))
density = np.random.rand(grid_size, grid_size)  # Initialize random density

# Example fluid simulation update function
def update_fluid_simulation():
    global density
    # Example update: Apply simple diffusion for each step (to be replaced with actual fluid dynamics)
    density = density * 0.99 + np.random.rand(grid_size, grid_size) * 0.01  # Random diffusion
    return density.tolist()

@socketio.on('start_simulation')
def handle_start_simulation(data):
    global grid_size
    grid_size = data.get('grid_size', 100)
    updated_density = update_fluid_simulation()
    emit('simulation_update', {'density': updated_density})

@socketio.on('add_force')
def handle_add_force(data):
    global density
    x = data['x']
    y = data['y']
    # Add force: increase density at the clicked location
    if 0 <= x < grid_size and 0 <= y < grid_size:
        density[x, y] += 1  # Add force by increasing density at that point
    updated_density = update_fluid_simulation()  # Recalculate the fluid simulation
    emit('simulation_update', {'density': updated_density})

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=3001)
