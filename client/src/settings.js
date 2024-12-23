export class Settings {
    constructor() {
        // Mode select flag
        this.isSinglePlayer = 0;

        // Game Settings
        this.gameDuration = 30000;
        this.spawnDelay = 2000; 
        this.endSceneDuration = 5000;

        // Ship Configuration
        this.shipSpeed = 4;
        this.laserMax = 30;
        this.laserInterval = 450;
        this.laserSpeed = 200;
        this.laserLifespan = 5;

        // Asteroids Configuration
        this.asteroids_x_vel_min = -50;
        this.asteroids_x_vel_max = 50;
        this.asteroids_y_vel_min = -50;
        this.asteroids_y_vel_max = 50;
        this.asteroids_x_coverage = 200;
        this.asteroids_scale_min = 1;
        this.asteroids_scale_max = 1.5;
        this.num_asteroids = 20;
        this.asteroids_frame_rate = 30;
        this.asteroids_mass = 10000;

        // Point Configuration
        this.meteorScore = 150;
        this.hitByLaserPenalty = 100;
        this.hitByMeteorPenalty = 250;


    }
}

export const CURRENT_SETTINGS = new Settings();