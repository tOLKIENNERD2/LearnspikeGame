export default class Octopus {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = 15;
        this.speed = 1 + Math.random() * 0.5; // Increase base speed
        this.dx = (Math.random() - 0.5) * this.speed;
        this.dy = (Math.random() - 0.5) * this.speed;
        this.changeDirectionInterval = 2000 + Math.random() * 3000; // Random interval between 2-5 seconds
        this.lastDirectionChange = Date.now();
        this.avoidDistance = 100; // Distance at which octopus starts avoiding fish
        this.edgeAvoidDistance = 50; // Distance from edge to start avoiding
        this.stuckCounter = 0;
        this.maxStuckTime = 60; // 1 second at 60 FPS
    }

    move(fish) {  // Remove rock parameter
        const oldX = this.x;
        const oldY = this.y;

        // Change direction randomly
        if (Date.now() - this.lastDirectionChange > this.changeDirectionInterval) {
            this.dx = (Math.random() - 0.5) * this.speed * 2; // Increase random movement speed
            this.dy = (Math.random() - 0.5) * this.speed * 2;
            this.lastDirectionChange = Date.now();
        }

        // Avoid fish if too close
        const distToFish = Math.hypot(this.x - fish.x, this.y - fish.y);
        if (distToFish < this.avoidDistance) {
            const avoidFactor = 1 - (distToFish / this.avoidDistance);
            this.dx -= (fish.x - this.x) / distToFish * avoidFactor * 0.5;
            this.dy -= (fish.y - this.y) / distToFish * avoidFactor * 0.5;
        }

        // Avoid canvas edges
        const edgeForce = this.avoidEdges();
        this.dx += edgeForce.x;
        this.dy += edgeForce.y;

        // Move octopus
        this.x += this.dx;
        this.y += this.dy;

        // Ensure octopus stays within canvas
        this.x = Math.max(this.radius, Math.min(this.x, this.canvas.width - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, this.canvas.height - this.radius));

        // Limit speed
        const speed = Math.hypot(this.dx, this.dy);
        if (speed > this.speed) {
            this.dx = (this.dx / speed) * this.speed;
            this.dy = (this.dy / speed) * this.speed;
        }

        // Check if stuck
        if (Math.abs(this.x - oldX) < 0.1 && Math.abs(this.y - oldY) < 0.1) {
            this.stuckCounter++;
            if (this.stuckCounter > this.maxStuckTime) {
                this.unstuck();
            }
        } else {
            this.stuckCounter = 0;
        }
    }

    unstuck() {
        // Move to a random position away from edges
        this.x = this.radius * 2 + Math.random() * (this.canvas.width - this.radius * 4);
        this.y = this.radius * 2 + Math.random() * (this.canvas.height - this.radius * 4);
        this.dx = (Math.random() - 0.5) * this.speed * 2;
        this.dy = (Math.random() - 0.5) * this.speed * 2;
        this.stuckCounter = 0;
    }

    avoidEdges() {
        let forceX = 0;
        let forceY = 0;

        if (this.x < this.edgeAvoidDistance) {
            forceX = (this.edgeAvoidDistance - this.x) / this.edgeAvoidDistance;
        } else if (this.x > this.canvas.width - this.edgeAvoidDistance) {
            forceX = (this.canvas.width - this.edgeAvoidDistance - this.x) / this.edgeAvoidDistance;
        }

        if (this.y < this.edgeAvoidDistance) {
            forceY = (this.edgeAvoidDistance - this.y) / this.edgeAvoidDistance;
        } else if (this.y > this.canvas.height - this.edgeAvoidDistance) {
            forceY = (this.canvas.height - this.edgeAvoidDistance - this.y) / this.edgeAvoidDistance;
        }

        return { x: forceX, y: forceY };
    }

    draw(ctx) {
        // Save the current context state
        ctx.save();

        // Translate to the octopus's position
        ctx.translate(this.x, this.y);

        // Rotate based on movement direction
        ctx.rotate(Math.atan2(this.dy, this.dx));

        // Draw the body
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.5, this.radius, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'purple';
        ctx.fill();

        // Draw the eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.radius * 0.7, -this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.7, this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.radius * 0.8, -this.radius * 0.3, this.radius * 0.1, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.8, this.radius * 0.3, this.radius * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Draw tentacles
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = this.radius * 0.3;
        ctx.lineCap = 'round';

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI - Math.PI / 2;
            const length = this.radius * (1.5 + Math.sin(Date.now() / 200 + i) * 0.3);

            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.5, 0);
            ctx.quadraticCurveTo(
                -this.radius * 2 * Math.cos(angle),
                length * Math.sin(angle),
                -this.radius * 2.5 * Math.cos(angle),
                length * 1.2 * Math.sin(angle)
            );
            ctx.stroke();
        }

        // Restore the context state
        ctx.restore();
    }
}