export default class SharkFish {
    constructor(canvas, fishSpeed) {
        this.canvas = canvas;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 30;
        this.baseSpeed = fishSpeed * 1.5;
        this.speed = this.baseSpeed;
        this.angle = Math.random() * Math.PI * 2;
        this.turnSpeed = 0.03;
        this.state = 'patrol';
        this.patrolTimer = 0;
        this.patrolDuration = 300;
        this.chaseTimer = 0;
        this.chaseDuration = 180;
        this.restTimer = 0;
        this.restDuration = 60;
    }

    move(targetX, targetY) {
        switch (this.state) {
            case 'patrol':
                this.patrol();
                break;
            case 'chase':
                this.chase(targetX, targetY);
                break;
            case 'rest':
                this.rest();
                break;
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.keepInBounds();
    }

    patrol() {
        this.speed = this.baseSpeed * 0.7;
        this.angle += (Math.random() - 0.5) * this.turnSpeed;
        this.patrolTimer++;

        if (this.patrolTimer >= this.patrolDuration) {
            this.state = 'chase';
            this.patrolTimer = 0;
        }
    }

    chase(targetX, targetY) {
        this.speed = this.baseSpeed * 1.2;
        const targetAngle = Math.atan2(targetY - this.y, targetX - this.x);
        const angleDiff = targetAngle - this.angle;
        
        this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.turnSpeed * 2);
        this.chaseTimer++;

        if (this.chaseTimer >= this.chaseDuration) {
            this.state = 'rest';
            this.chaseTimer = 0;
        }
    }

    rest() {
        this.speed = 0;
        this.restTimer++;

        if (this.restTimer >= this.restDuration) {
            this.state = 'patrol';
            this.restTimer = 0;
        }
    }

    keepInBounds() {
        const padding = this.radius;
        if (this.x < padding || this.x > this.canvas.width - padding) {
            this.angle = Math.PI - this.angle;
        }
        if (this.y < padding || this.y > this.canvas.height - padding) {
            this.angle = -this.angle;
        }

        this.x = Math.max(padding, Math.min(this.canvas.width - padding, this.x));
        this.y = Math.max(padding, Math.min(this.canvas.height - padding, this.y));
    }

    draw(ctx, sharkFishImage) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Adjust these values to fit your image
        const drawWidth = this.radius * 4;  // Increase the width
        const drawHeight = this.radius * 4; // Increase the height
        ctx.drawImage(sharkFishImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        
        // Draw state indicator
        ctx.fillStyle = this.state === 'patrol' ? 'yellow' : this.state === 'chase' ? 'red' : 'green';
        ctx.beginPath();
        ctx.arc(0, -drawHeight / 2 - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    catchFish(fish) {
        const dx = this.x - fish.x;
        const dy = this.y - fish.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + fish.radius;
    }
}