export default class SharkFish {
    constructor(canvas, fishSpeed) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = 30;
        this.speed = fishSpeed * 1.2; // Increased speed to chase more aggressively
        this.dx = 0;
        this.dy = 0;
        this.chaseTime = 0;
        this.restTime = 0;
        this.avoidanceRadius = 100; // Radius to start avoiding obstacles
    }

    move(targetX, targetY, canvas, rock) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Avoid getting too close to canvas edges
        const edgeAvoidance = this.avoidEdges(canvas);
        
        // Avoid the rock
        const rockAvoidance = this.avoidRock(rock);

        if (this.chaseTime > 0) {
            // Chase mode
            this.chaseTime--;
            if (distance > 0) {
                this.dx = (dx / distance) * this.speed;
                this.dy = (dy / distance) * this.speed;
            }
        } else if (this.restTime > 0) {
            // Rest mode
            this.restTime--;
            this.dx *= 0.95;
            this.dy *= 0.95;
        } else {
            // Switch between chase and rest
            if (Math.random() < 0.7) {
                this.chaseTime = 120; // Chase for 2 seconds (assuming 60 FPS)
            } else {
                this.restTime = 60; // Rest for 1 second
            }
        }

        // Apply avoidance behaviors
        this.dx += edgeAvoidance.x + rockAvoidance.x;
        this.dy += edgeAvoidance.y + rockAvoidance.y;

        // Normalize speed
        const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        if (currentSpeed > this.speed) {
            this.dx = (this.dx / currentSpeed) * this.speed;
            this.dy = (this.dy / currentSpeed) * this.speed;
        }

        this.x += this.dx;
        this.y += this.dy;

        // Keep sharkFish within canvas bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }

    avoidEdges(canvas) {
        let avoidX = 0;
        let avoidY = 0;
        
        if (this.x < this.avoidanceRadius) avoidX = this.avoidanceRadius - this.x;
        if (this.x > canvas.width - this.avoidanceRadius) avoidX = canvas.width - this.avoidanceRadius - this.x;
        if (this.y < this.avoidanceRadius) avoidY = this.avoidanceRadius - this.y;
        if (this.y > canvas.height - this.avoidanceRadius) avoidY = canvas.height - this.avoidanceRadius - this.y;

        return { x: avoidX, y: avoidY };
    }

    avoidRock(rock) {
        const dx = this.x - (rock.x + rock.width / 2);
        const dy = this.y - (rock.y + rock.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.avoidanceRadius + rock.collisionRadius) {
            return {
                x: (dx / distance) * (this.avoidanceRadius + rock.collisionRadius - distance),
                y: (dy / distance) * (this.avoidanceRadius + rock.collisionRadius - distance)
            };
        }

        return { x: 0, y: 0 };
    }

    draw(ctx, sharkFishImage) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.dy, this.dx));
        ctx.drawImage(sharkFishImage, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }

    catchFish(fish) {
        const dx = this.x - fish.x;
        const dy = this.y - fish.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + fish.radius;
    }
}