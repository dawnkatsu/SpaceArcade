export class Settings {
    constructor() {
        // Mode select flag
        this.isSinglePlayer = 0;

        // Ship Configuration
        this.shipSpeed = 150;
        this.laserMax = 30;
        this.laserInterval = 450;
        this.laserSpeed = 200;
        this.laserLifespan = 5;

        // Asteroids Configuration
        this.asteroids_x_vel_min = -25;
        this.asteroids_x_vel_max = 25;
        this.asteroids_y_vel_min = -25;
        this.asteroids_y_vel_max = 25;
        this.asteroids_x_coverage = 200;
        this.asteroids_scale_min = 1;
        this.asteroids_scale_max = 1.5;
        this.num_asteroids = 25;
        this.asteroids_frame_rate = 30;
        this.asteroids_mass = 10000;

        // Point Configuration
        this.meteorScore = 100;
        this.hitPenalty = 100;


    }
}

export const CURRENT_SETTINGS = new Settings();