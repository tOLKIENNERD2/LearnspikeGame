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
    }

    move(targetX, targetY, canvas) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

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

        this.x += this.dx;
        this.y += this.dy;

        // Keep sharkFish within canvas bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
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