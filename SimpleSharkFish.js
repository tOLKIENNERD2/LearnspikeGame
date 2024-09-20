export default class SimpleSharkFish {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = 50; // Increased from 30 to 50 to make it bigger
        this.speed = 2;
    }

    move(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        // Keep the shark fish within the canvas
        this.x = Math.max(this.radius, Math.min(this.x, this.canvas.width - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, this.canvas.height - this.radius));
    }

    draw(ctx, sharkFishImage) {
        if (sharkFishImage) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.atan2(this.y - this.canvas.height / 2, this.x - this.canvas.width / 2));
            ctx.drawImage(sharkFishImage, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        } else {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    catchFish(fish) {
        const dx = this.x - fish.x;
        const dy = this.y - fish.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = this.radius + fish.radius * 0.8; // Reduced collision distance
        return distance < minDistance;
    }

    drawFallback(ctx) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}