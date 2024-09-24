import Fish from './Fish.js';
import SimpleSharkFish from './SimpleSharkFish.js';

export default class Rock {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 150;
        this.height = 120;
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

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw the main rock shape
        ctx.fillStyle = '#808080';
        ctx.fill(this.collisionPath);
        
        // Add some shading and texture
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 2;
        ctx.stroke(this.collisionPath);
        // Temporarily hide the rock
        ctx.globalAlpha = 0;
        // Add some highlights
        ctx.beginPath();
        ctx.moveTo(0.3 * this.width, 0.3 * this.height);
        ctx.lineTo(0.6 * this.width, 0.25 * this.height);
        ctx.strokeStyle = '#A0A0A0';
        ctx.lineWidth = 3;
        ctx.stroke();
        
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

    initializeLevelElements(level, gameState) {
        // Reset fish, monsterfish (SharkFish), and score for the new level
        gameState.fish = [];
        gameState.sharkFish = null;
        gameState.score = 0;

        // Add fish based on the level
        const fishCount = 5 + (level * 2); // Increase fish count with each level
        for (let i = 0; i < fishCount; i++) {
            gameState.fish.push(new Fish(this.canvas));
        }

        // Add monsterfish (SharkFish) based on the level
        if (level >= 2) {
            gameState.sharkFish = new SimpleSharkFish(this.canvas);
        }

        console.log(`Level ${level} initialized with ${fishCount} fish and ${gameState.sharkFish ? 'a monsterfish' : 'no monsterfish'}`);
    }
}