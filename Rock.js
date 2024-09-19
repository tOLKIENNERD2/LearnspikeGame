export default class Rock {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 200;  // Increased size
        this.height = 160; // Increased size
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height / 2 - this.height / 2;
        this.collisionPath = this.createCollisionPath();
    }

    createCollisionPath() {
        const path = new Path2D();
        path.moveTo(0.2 * this.width, 0.8 * this.height);
        path.lineTo(0.1 * this.width, 0.5 * this.height);
        path.lineTo(0.3 * this.width, 0.3 * this.height);
        path.lineTo(0.7 * this.width, 0.2 * this.height);
        path.lineTo(0.9 * this.width, 0.4 * this.height);
        path.lineTo(0.8 * this.width, 0.7 * this.height);
        path.closePath();
        return path;
    }

    draw(ctx, rockImage) {
        ctx.drawImage(rockImage, this.x, this.y, this.width, this.height);
        
        // Visualize the collision area (for debugging)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = 'red';
        ctx.stroke(this.collisionPath);
        ctx.restore();
    }

    checkCollision(entity) {
        const ctx = this.canvas.getContext('2d');
        ctx.save();
        ctx.translate(this.x, this.y);
        const collision = ctx.isPointInPath(this.collisionPath, entity.x - this.x, entity.y - this.y);
        ctx.restore();
        return collision;
    }

    getCollisionNormal(entity) {
        // Simplified collision normal calculation
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const dx = entity.x - centerX;
        const dy = entity.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return {
            x: dx / distance,
            y: dy / distance
        };
    }
}