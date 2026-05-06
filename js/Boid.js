import Vector2D from './Vector2D.js';

/**
 * Boid Class
 * Implements the core Boids algorithm steering behaviors.
 */
class Boid {
    constructor(x, y, config) {
        this.position = new Vector2D(x, y);
        this.velocity = Vector2D.random(-1, -1, 1, 1).setMag(Math.random() * 2 + 2);
        this.acceleration = new Vector2D(0, 0);
        this.config = config;
        
        // Visuals
        const hue = Math.random() * 20 + 200; // Sky blues
        this.color = `hsl(${hue}, 30%, ${Math.random() * 20 + 70}%)`; 
        this.size = 2.5 + Math.random() * 1.5;
        
        // Animation
        this.flapPhase = Math.random() * Math.PI * 2;
        this.flapBaseSpeed = 0.15 + Math.random() * 0.1;
    }

    update(dt) {
        // Normalize movement to 60 FPS (16.67ms per frame)
        const timeStep = Math.min(dt / 16.67, 3); 
        
        this.velocity.add(this.acceleration.copy().mult(timeStep));
        this.velocity.limit(this.config.maxSpeed);
        this.position.add(this.velocity.copy().mult(timeStep));
        this.acceleration.mult(0);
        this.wrapEdges();

        // Animation: Flap speed depends on velocity
        const speed = this.velocity.mag();
        this.flapPhase += this.flapBaseSpeed * speed * timeStep;
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    wrapEdges() {
        const { width, height } = this.config.bounds;
        if (this.position.x < 0) this.position.x = width;
        else if (this.position.x > width) this.position.x = 0;
        
        if (this.position.y < 0) this.position.y = height;
        else if (this.position.y > height) this.position.y = 0;
    }

    flock(boids, predator, obstacles, mouse) {
        // Find neighbors for each rule (optimized in Simulation.js via SpatialGrid)
        const sepNeighbors = boids.filter(b => this.position.dist(b.position) < this.config.sepRadius);
        const aliNeighbors = boids.filter(b => this.position.dist(b.position) < this.config.aliRadius);
        const cohNeighbors = boids.filter(b => this.position.dist(b.position) < this.config.cohRadius);

        const separation = this.separate(sepNeighbors).mult(this.config.sepWeight);
        const alignment = this.align(aliNeighbors).mult(this.config.aliWeight);
        const cohesion = this.cohere(cohNeighbors).mult(this.config.cohWeight);

        this.applyForce(separation);
        this.applyForce(alignment);
        this.applyForce(cohesion);

        // Predator avoidance
        if (predator && this.config.predatorActive) {
            const d = this.position.dist(predator.position);
            if (d < this.config.fearRadius) {
                const evasion = this.flee(predator.position).mult(2.5); // High priority
                this.applyForce(evasion);
            }
        }

        // Obstacle avoidance
        if (obstacles && obstacles.length > 0) {
            const avoid = this.avoidObstacles(obstacles).mult(3.0); // Very high priority
            this.applyForce(avoid);
        }

        // Mouse interaction
        if (mouse && mouse.mode !== 'off' && mouse.isDown) {
            const interaction = this.interactWithMouse(mouse).mult(1.5);
            this.applyForce(interaction);
        }
    }

    avoidObstacles(obstacles) {
        let steer = new Vector2D(0, 0);
        let count = 0;
        const lookahead = 60; // How far to look ahead

        for (const obs of obstacles) {
            const d = this.position.dist(obs.position);
            // If we're inside or headed towards an obstacle
            if (d < obs.radius + lookahead) {
                let diff = Vector2D.sub(this.position, obs.position);
                diff.normalize();
                diff.div(d); // Stronger force when closer
                steer.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steer.div(count);
            steer.setMag(this.config.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.config.maxForce * 2.5);
        }
        return steer;
    }

    interactWithMouse(mouse) {
        if (mouse.mode === 'attract') {
            return this.seek(mouse.position);
        } else if (mouse.mode === 'repel') {
            const d = this.position.dist(mouse.position);
            if (d < 200) {
                return this.flee(mouse.position);
            }
        }
        return new Vector2D(0, 0);
    }

    separate(neighbors) {
        let steer = new Vector2D(0, 0);
        let count = 0;
        for (const other of neighbors) {
            let diff = Vector2D.sub(this.position, other.position);
            const d = diff.mag();
            if (d > 0) {
                diff.div(d * d); // Weight by distance squared
                steer.add(diff);
                count++;
            }
        }
        if (count > 0) {
            steer.div(count);
        }
        if (steer.mag() > 0) {
            steer.setMag(this.config.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.config.maxForce);
        }
        return steer;
    }

    align(neighbors) {
        let steer = new Vector2D(0, 0);
        let count = 0;
        for (const other of neighbors) {
            steer.add(other.velocity);
            count++;
        }
        if (count > 0) {
            steer.div(count);
            steer.setMag(this.config.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.config.maxForce);
        }
        return steer;
    }

    cohere(neighbors) {
        let center = new Vector2D(0, 0);
        let count = 0;
        for (const other of neighbors) {
            center.add(other.position);
            count++;
        }
        if (count > 0) {
            center.div(count);
            return this.seek(center);
        }
        return new Vector2D(0, 0);
    }

    seek(target) {
        let desired = Vector2D.sub(target, this.position);
        desired.setMag(this.config.maxSpeed);
        let steer = Vector2D.sub(desired, this.velocity);
        steer.limit(this.config.maxForce);
        return steer;
    }

    flee(target) {
        let desired = Vector2D.sub(this.position, target);
        desired.setMag(this.config.maxSpeed);
        let steer = Vector2D.sub(desired, this.velocity);
        steer.limit(this.config.maxForce * 2);
        return steer;
    }

    draw(ctx) {
        const angle = this.velocity.heading();
        const wingFactor = Math.sin(this.flapPhase);
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);
        
        // Body (slender teardrop)
        ctx.beginPath();
        ctx.moveTo(this.size * 2, 0);
        ctx.quadraticCurveTo(0, this.size, -this.size, 0);
        ctx.quadraticCurveTo(0, -this.size, this.size * 2, 0);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Wings
        const wingSpan = this.size * 4;
        const wingWidth = this.size * 1.5;
        const flapHeight = wingFactor * wingSpan * 0.8;

        ctx.beginPath();
        // Left Wing
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
            -wingWidth, flapHeight, 
            -wingSpan, flapHeight, 
            -wingSpan * 0.8, 0
        );
        // Right Wing
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
            -wingWidth, -flapHeight, 
            -wingSpan, -flapHeight, 
            -wingSpan * 0.8, 0
        );
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Head/Beak
        ctx.beginPath();
        ctx.moveTo(this.size * 2, 0);
        ctx.lineTo(this.size * 2.5, 0);
        ctx.strokeStyle = '#f59e0b'; // Golden beak
        ctx.lineWidth = 1;
        ctx.stroke();

        // Perception radii for debugging
        if (this.config.showRadii) {
            ctx.restore();
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.config.sepRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.config.aliRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.stroke();
        }

        ctx.restore();
    }
}

export default Boid;
