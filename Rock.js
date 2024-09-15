export default class Rock {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 100;  // Reduced size for visibility
        this.height = 80;  // Reduced size for visibility
        this.x = canvas.width / 2 - this.width / 2;  // Center horizontally
        this.y = canvas.height / 2 - this.height / 2;  // Center vertically
        this.collisionRadius = 40;  // Smaller circular collision range
    }

    draw(ctx, rockImage) {
        ctx.drawImage(rockImage, this.x, this.y, this.width, this.height);
        
        // Visualize the collision area
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.collisionRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    checkCollision(entity) {
        const dx = (this.x + this.width / 2) - entity.x;
        const dy = (this.y + this.height / 2) - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.collisionRadius + entity.radius;
    }

    getCollisionNormal(entity) {
        const dx = entity.x - (this.x + this.width / 2);
        const dy = entity.y - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return {
            x: dx / distance,
            y: dy / distance
        };
    }
}