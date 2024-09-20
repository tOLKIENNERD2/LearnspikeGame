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

        // Add new properties for tentacles
        this.tentacles = [];
        this.numTentacles = 8;
        this.tentacleLength = this.radius * 1.5;
        this.initTentacles();

        // Add a random shade of blue
        this.color = this.getRandomBlueShade();
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

    initTentacles() {
        for (let i = 0; i < this.numTentacles; i++) {
            this.tentacles.push({
                angle: (i / this.numTentacles) * Math.PI * 2,
                segments: []
            });
            for (let j = 0; j < 5; j++) {
                this.tentacles[i].segments.push({
                    x: 0,
                    y: 0
                });
            }
        }
    }

    draw(ctx) {
        // Draw tentacles
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.radius / 6;
        ctx.lineCap = 'round';

        this.tentacles.forEach(tentacle => {
            ctx.beginPath();
            let startX = this.x + Math.cos(tentacle.angle) * this.radius * 0.8;
            let startY = this.y + Math.sin(tentacle.angle) * this.radius * 0.8;
            ctx.moveTo(startX, startY);

            let prevX = startX;
            let prevY = startY;

            tentacle.segments.forEach((segment, index) => {
                const length = (this.tentacleLength / tentacle.segments.length) * (1 - index / tentacle.segments.length * 0.5);
                const waveOffset = Math.sin(Date.now() / 500 + index * 0.5) * 15;
                const perpX = Math.cos(tentacle.angle + Math.PI/2);
                const perpY = Math.sin(tentacle.angle + Math.PI/2);
                
                segment.x = prevX + Math.cos(tentacle.angle) * length + perpX * waveOffset;
                segment.y = prevY + Math.sin(tentacle.angle) * length + perpY * waveOffset;
                
                ctx.quadraticCurveTo(
                    prevX + Math.cos(tentacle.angle) * length / 2 + perpX * waveOffset * 1.5,
                    prevY + Math.sin(tentacle.angle) * length / 2 + perpY * waveOffset * 1.5,
                    segment.x,
                    segment.y
                );

                prevX = segment.x;
                prevY = segment.y;
            });

            ctx.stroke();
        });

        // Draw body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius, this.radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw mantle
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - this.radius * 0.3, this.radius * 0.8, this.radius * 0.6, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Draw eyes
        const eyeRadius = this.radius / 6;
        const eyeOffset = this.radius / 3;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - eyeOffset, this.y - eyeOffset, eyeRadius, 0, Math.PI * 2);
        ctx.arc(this.x + eyeOffset, this.y - eyeOffset, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - eyeOffset, this.y - eyeOffset, eyeRadius / 2, 0, Math.PI * 2);
        ctx.arc(this.x + eyeOffset, this.y - eyeOffset, eyeRadius / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    getRandomBlueShade() {
        const r = Math.floor(Math.random() * 50);   // 0-50 for red
        const g = Math.floor(Math.random() * 100);  // 0-100 for green
        const b = Math.floor(Math.random() * 155) + 100;  // 100-255 for blue
        return `rgb(${r}, ${g}, ${b})`;
    }
}