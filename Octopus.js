export default class Octopus {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = 15;
        this.tentacleLength = 20;
        this.color = `rgb(${Math.random() * 100 + 155}, 0, ${Math.random() * 100 + 155})`;
        this.animationOffset = Math.random() * Math.PI * 2; // Random starting point for animation
        this.speed = 1 + Math.random() * 0.5; // Increased speed for fleeing
    }

    move(fish, rock) {
        // Run away from the fish
        const dx = this.x - fish.x;
        const dy = this.y - fish.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) { // Start fleeing when fish is within 200 pixels
            const fleeMultiplier = 1 - (distance / 200); // Flee faster when fish is closer
            this.x += (dx / distance) * this.speed * fleeMultiplier;
            this.y += (dy / distance) * this.speed * fleeMultiplier;
        } else {
            // Random movement when fish is far away
            this.x += (Math.random() - 0.5) * this.speed;
            this.y += (Math.random() - 0.5) * this.speed;
        }

        // Avoid rock
        if (rock.checkCollision(this)) {
            const normal = rock.getCollisionNormal(this);
            this.x += normal.x * this.speed;
            this.y += normal.y * this.speed;
        }

        // Keep within canvas bounds
        this.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(this.canvas.height - this.radius, this.y));
    }

    draw(ctx) {
        const time = Date.now() / 1000; // Current time in seconds
        
        // Draw body with pulsating effect
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (1 + Math.sin(time * 2 + this.animationOffset) * 0.1), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Draw eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 1.5, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        // Draw animated tentacles
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.radius);
            const angle = (Math.PI / 4) * i;
            const waveOffset = Math.sin(time * 5 + this.animationOffset + i) * 5; // Wavy motion
            const endX = this.x + Math.cos(angle) * (this.tentacleLength + waveOffset);
            const endY = this.y + this.radius + Math.sin(angle) * (this.tentacleLength + waveOffset);
            ctx.quadraticCurveTo(
                this.x + Math.cos(angle) * this.tentacleLength * 0.5,
                this.y + this.radius + Math.sin(angle) * this.tentacleLength * 0.5,
                endX, endY
            );
            ctx.stroke();
        }
    }
}