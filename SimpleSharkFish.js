export default class SimpleSharkFish {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 45;  // Increased from 30 to 45
        this.speed = 1.5;  // Slightly reduced speed for balance
    }

    move(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        this.keepInBounds();
    }

    keepInBounds() {
        this.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(this.canvas.height - this.radius, this.y));
    }

    draw(ctx, image) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.y - this.canvas.height / 2, this.x - this.canvas.width / 2));
        ctx.drawImage(image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }

    catchFish(fish) {
        const dx = this.x - fish.x;
        const dy = this.y - fish.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + fish.radius * 0.8;  // Adjusted collision detection
    }

    drawFallback(ctx) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}