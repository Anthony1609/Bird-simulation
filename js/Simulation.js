import Vector2D from './Vector2D.js';
import Boid from './Boid.js';
import Predator from './Predator.js';
import SpatialGrid from './SpatialGrid.js';
import UI from './UI.js';

/**
 * Simulation Class
 * Orchestrates the boids, predator, spatial grid, and rendering loop.
 */
class Simulation {
    constructor() {
        this.canvas = document.getElementById('simulation-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.config = {
            boidCount: 100,
            maxSpeed: 3.5,
            maxForce: 0.15,
            sepWeight: 1.5,
            sepRadius: 25,
            aliWeight: 1.0,
            aliRadius: 50,
            cohWeight: 1.0,
            cohRadius: 50,
            predatorActive: true,
            fearRadius: 80,
            speedFactor: 1.0,
            showRadii: false,
            bounds: { width: 0, height: 0 }
        };

        this.boids = [];
        this.predator = null;
        this.grid = null;
        this.obstacles = [];
        this.mouse = {
            position: new Vector2D(0, 0),
            isDown: false,
            mode: 'off' // 'off', 'attract', 'repel'
        };
        this.lastTime = 0;
        this.fps = 0;

        this.ui = new UI(
            this.config, 
            () => this.reset(), 
            () => this.randomize(),
            () => this.clearObstacles(),
            this.mouse
        );

        this.init();
        this.animate();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', () => this.mouse.isDown = true);
        this.canvas.addEventListener('mouseup', () => this.mouse.isDown = false);
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.addObstacle(e.clientX, e.clientY);
        });

        this.reset();
    }

    handleMouseMove(e) {
        this.mouse.position.x = e.clientX;
        this.mouse.position.y = e.clientY;
    }

    addObstacle(x, y) {
        this.obstacles.push({
            position: new Vector2D(x, y),
            radius: 30 + Math.random() * 20
        });
    }

    clearObstacles() {
        this.obstacles = [];
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.config.bounds.width = this.canvas.width;
        this.config.bounds.height = this.canvas.height;
        
        // Re-initialize grid on resize
        const cellSize = 60; // Slightly larger than max radius
        this.grid = new SpatialGrid(this.canvas.width, this.canvas.height, cellSize);
    }

    reset() {
        this.boids = [];
        for (let i = 0; i < this.config.boidCount; i++) {
            this.boids.push(new Boid(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                this.config
            ));
        }

        this.predator = new Predator(
            Math.random() * this.canvas.width,
            Math.random() * this.canvas.height,
            this.config
        );
        
        this.ui.setBoidCount(this.boids.length);
    }

    randomize() {
        this.config.sepWeight = Math.random() * 2.5 + 0.5;
        this.config.aliWeight = Math.random() * 2.0;
        this.config.cohWeight = Math.random() * 2.0;
        this.config.maxSpeed = Math.random() * 4 + 2;
        this.config.aliRadius = Math.random() * 80 + 20;
        this.config.cohRadius = Math.random() * 80 + 20;
    }

    update(dt) {
        // Apply speed factor
        const adjustedDt = dt * (this.config.speedFactor || 1.0);

        // Clear and populate spatial grid
        this.grid.clear();
        for (const boid of this.boids) {
            this.grid.insert(boid);
        }

        // Update Boids
        for (const boid of this.boids) {
            // ... (neighbor lookup)
            const maxRadius = Math.max(
                this.config.sepRadius, 
                this.config.aliRadius, 
                this.config.cohRadius
            );
            
            const neighbors = this.grid.getNeighbors(boid, maxRadius);
            
            boid.flock(neighbors, this.predator, this.obstacles, this.mouse);
            boid.update(adjustedDt);
        }

        // Update Predator
        if (this.config.predatorActive) {
            this.predator.chase(this.boids, this.obstacles);
            this.predator.update(adjustedDt);
        }

        // Calculate FPS
        if (dt > 0) {
            this.fps = 1000 / dt;
            this.ui.setFPS(this.fps);
        }
    }

    draw() {
        // Sky Gradient Background
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#1e293b'); // Darker at top
        grad.addColorStop(1, '#334155'); // Lighter at bottom
        
        // Semi-transparent overlay for trails (wind effect)
        this.ctx.fillStyle = 'rgba(30, 41, 59, 0.25)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw obstacles (Cloud-like or rock-like)
        for (const obs of this.obstacles) {
            this.ctx.beginPath();
            this.ctx.arc(obs.position.x, obs.position.y, obs.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.setLineDash([5, 5]); // Dashed border for cloud feel
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.setLineDash([]); // Reset
        }

        for (const boid of this.boids) {
            boid.draw(this.ctx);
        }

        if (this.config.predatorActive) {
            this.predator.draw(this.ctx);
        }
    }

    animate(timestamp = 0) {
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.animate(t));
    }
}

// Launch simulation
new Simulation();
