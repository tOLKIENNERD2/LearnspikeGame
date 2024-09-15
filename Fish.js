export default class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 40;
        this.maxSpeed = 5;
        this.dx = 0;
        this.dy = 0;
        this.rotation = 0;
        this.acceleration = 0.5;
        this.deceleration = 0.9;
    }

    move(canvas) {
        // Apply deceleration
        this.dx *= this.deceleration;
        this.dy *= this.deceleration;

        // Update position
        this.x += this.dx;
        this.y += this.dy;

        // Keep fish within canvas bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

        // Update rotation based on movement direction
        if (Math.abs(this.dx) > 0.1 || Math.abs(this.dy) > 0.1) {
            this.rotation = Math.atan2(this.dy, this.dx);
        }
    }

    accelerate(direction) {
        switch(direction) {
            case 'left':
                this.dx -= this.acceleration;
                break;
            case 'right':
                this.dx += this.acceleration;
                break;
            case 'up':
                this.dy -= this.acceleration;
                break;
            case 'down':
                this.dy += this.acceleration;
                break;
        }
        // Limit speed
        const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        if (speed > this.maxSpeed) {
            this.dx = (this.dx / speed) * this.maxSpeed;
            this.dy = (this.dy / speed) * this.maxSpeed;
        }
    }

    draw(ctx, fishImage) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(fishImage, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }

    catchOctopus(octopus) {
        const dx = this.x - octopus.x;
        const dy = this.y - octopus.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + octopus.radius;
    }
}