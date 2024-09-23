export default class Squid {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = 30;
        this.speed = 2;
        this.color = '#800080'; // Purple color for squid
    }

    move(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        // Keep squid within canvas bounds
        this.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(this.canvas.height - this.radius, this.y));
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw tentacles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const tentacleLength = this.radius * 1.5;
            const endX = this.x + Math.cos(angle) * tentacleLength;
            const endY = this.y + Math.sin(angle) * tentacleLength;
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}