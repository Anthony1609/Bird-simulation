import Vector2D from './Vector2D.js';

/**
 * Predator Class
 * A specialized agent that chases boids using pursuit steering.
 */
class Predator {
    constructor(x, y, config) {
        this.position = new Vector2D(x, y);
        this.velocity = Vector2D.random(-1, -1, 1, 1).setMag(4);
        this.acceleration = new Vector2D(0, 0);
        this.config = config;
        this.color = '#451a03'; // Dark brown Hawk color
        this.size = 8;
        this.maxSpeed = 4.5;
        this.maxForce = 0.2;
        
        // Animation
        this.flapPhase = 0;
    }

    update(dt) {
        const timeStep = Math.min(dt / 16.67, 3);
        
        this.velocity.add(this.acceleration.copy().mult(timeStep));
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity.copy().mult(timeStep));
        this.acceleration.mult(0);
        this.wrapEdges();

        // Animation
        this.flapPhase += 0.15 * this.velocity.mag() * timeStep;
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

    chase(boids, obstacles) {
        if (boids.length === 0) return;

        // Find nearest boid or nearest cluster center
        let nearest = null;
        let minDist = Infinity;

        for (const boid of boids) {
            const d = this.position.dist(boid.position);
            if (d < minDist) {
                minDist = d;
                nearest = boid;
            }
        }

        if (nearest) {
            // Simple pursuit: seek predicted position
            const predictionFactor = 10;
            const target = Vector2D.add(nearest.position, nearest.velocity.copy().mult(predictionFactor));
            const steer = this.seek(target);
            this.applyForce(steer);
        }

        // Obstacle avoidance
        if (obstacles && obstacles.length > 0) {
            const avoid = this.avoidObstacles(obstacles).mult(2.0);
            this.applyForce(avoid);
        }
    }

    avoidObstacles(obstacles) {
        let steer = new Vector2D(0, 0);
        let count = 0;
        const lookahead = 80;

        for (const obs of obstacles) {
            const d = this.position.dist(obs.position);
            if (d < obs.radius + lookahead) {
                let diff = Vector2D.sub(this.position, obs.position);
                diff.normalize().div(d);
                steer.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steer.div(count).setMag(this.maxSpeed).sub(this.velocity).limit(this.maxForce * 2);
        }
        return steer;
    }

    seek(target) {
        let desired = Vector2D.sub(target, this.position);
        desired.setMag(this.maxSpeed);
        let steer = Vector2D.sub(desired, this.velocity);
        steer.limit(this.maxForce);
        return steer;
    }

    draw(ctx) {
        const angle = this.velocity.heading();
        const wingFactor = Math.sin(this.flapPhase);
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);
        
        // Body (Powerful silhouette)
        ctx.beginPath();
        ctx.moveTo(this.size * 3, 0);
        ctx.quadraticCurveTo(0, this.size * 1.5, -this.size * 1.5, 0);
        ctx.quadraticCurveTo(0, -this.size * 1.5, this.size * 3, 0);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(-this.size * 3, this.size);
        ctx.lineTo(-this.size * 3, -this.size);
        ctx.closePath();
        ctx.fill();

        // Large Wings
        const wingSpan = this.size * 7;
        const wingWidth = this.size * 3;
        const flapHeight = wingFactor * wingSpan * 0.5;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        // Left Wing
        ctx.bezierCurveTo(
            -wingWidth, flapHeight, 
            -wingSpan, flapHeight, 
            -wingSpan * 0.7, 0
        );
        // Right Wing
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
            -wingWidth, -flapHeight, 
            -wingSpan, -flapHeight, 
            -wingSpan * 0.7, 0
        );
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Curved Beak
        ctx.beginPath();
        ctx.moveTo(this.size * 3, 0);
        ctx.quadraticCurveTo(this.size * 4, this.size, this.size * 3.5, this.size * 0.5);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

export default Predator;
