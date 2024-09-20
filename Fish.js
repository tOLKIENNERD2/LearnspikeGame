export default class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 40;
        this.maxSpeed = 5;
        this.dx = 0;
        this.dy = 0;
        this.angle = 0;
        this.targetAngle = 0;
        this.rotationSpeed = 0;
        this.maxRotationSpeed = 0.1; // Maximum rotation speed in radians per frame
        this.rotationDamping = 0.9; // Damping factor to slow down rotation
        this.acceleration = 0.5;
        this.deceleration = 0.9;
    }
//testtesttest
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

        // Calculate the target angle based on movement
        if (Math.abs(this.dx) > 0.1 || Math.abs(this.dy) > 0.1) {
            this.targetAngle = Math.atan2(this.dy, this.dx);
        }

        // Gradually adjust the current angle towards the target angle
        const angleDiff = this.targetAngle - this.angle;
        this.rotationSpeed += angleDiff * 0.1; // Adjust this factor to change responsiveness
        this.rotationSpeed *= this.rotationDamping;
        this.rotationSpeed = Math.max(-this.maxRotationSpeed, Math.min(this.maxRotationSpeed, this.rotationSpeed));
        this.angle += this.rotationSpeed;

        // Normalize angle to be between -PI and PI
        this.angle = (this.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI;

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
        ctx.rotate(this.angle);
        ctx.drawImage(fishImage, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }

    catchOctopus(octopus) {
        const dx = this.x - octopus.x;
        const dy = this.y - octopus.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + octopus.radius;
    }

    drawFallback(ctx) {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}