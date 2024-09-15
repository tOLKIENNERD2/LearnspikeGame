console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SharkFish from './SharkFish.js';
import Rock from './Rock.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage, rockImage;
let fish, octopuses, sharkFish, rock;
let score = 0;
let level = 1;  // Add this line to declare the level variable

let keys = {};

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage.width / backgroundImage.height;
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.9;
    
    if (maxWidth / aspectRatio <= maxHeight) {
        canvas.width = maxWidth;
        canvas.height = maxWidth / aspectRatio;
    } else {
        canvas.height = maxHeight;
        canvas.width = maxHeight * aspectRatio;
    }
    
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
}

function loadImages() {
    console.log("Loading images...");
    backgroundImage = new Image();
    backgroundImage.src = 'Seaweed1.png';
    
    fishImage = new Image();
    fishImage.src = 'Fish1.png';
    
    sharkFishImage = new Image();
    sharkFishImage.src = 'Monsterfish.png';
    
    rockImage = new Image();
    rockImage.src = 'Rock1.png';
    
    Promise.all([
        new Promise(resolve => backgroundImage.onload = resolve),
        new Promise(resolve => fishImage.onload = resolve),
        new Promise(resolve => sharkFishImage.onload = resolve),
        new Promise(resolve => rockImage.onload = resolve)
    ]).then(() => {
        console.log("All images loaded");
        initGame();
    }).catch(error => {
        console.error("Error loading images:", error);
    });
}

function drawBackground() {
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function initGame() {
    console.log("Initializing game");
    setupCanvas();
    rock = new Rock(canvas);  // Create rock first
    fish = new Fish(canvas.width / 4, canvas.height / 2);  // Move fish starting position
    octopuses = [new Octopus(canvas), new Octopus(canvas), new Octopus(canvas)];
    console.log("Octopuses:", octopuses);
    sharkFish = null;
    gameLoop();
}

function resetGame() {
    score = 0;
    level = 1;
    fish = new Fish(canvas.width / 4, canvas.height / 2);  // Move fish starting position
    octopuses = [new Octopus(canvas), new Octopus(canvas), new Octopus(canvas)];
    sharkFish = null;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    
    rock.draw(ctx, rockImage);
    
    // Move fish based on pressed keys
    if (keys.ArrowLeft) fish.accelerate('left');
    if (keys.ArrowRight) fish.accelerate('right');
    if (keys.ArrowUp) fish.accelerate('up');
    if (keys.ArrowDown) fish.accelerate('down');

    fish.move(canvas);

    // Check rock collision
    if (rock.checkCollision(fish)) {
        const normal = rock.getCollisionNormal(fish);
        const pushDistance = fish.radius + rock.collisionRadius - Math.sqrt((fish.x - rock.x - rock.width/2)**2 + (fish.y - rock.y - rock.height/2)**2);
        
        fish.x += normal.x * pushDistance;
        fish.y += normal.y * pushDistance;

        // Reflect velocity
        const dot = fish.dx * normal.x + fish.dy * normal.y;
        fish.dx -= 2 * dot * normal.x;
        fish.dy -= 2 * dot * normal.y;
    }

    fish.draw(ctx, fishImage);

    if (sharkFish) {
        sharkFish.move(fish.x, fish.y, canvas, rock);  // Pass the rock object here
        if (rock.checkCollision(sharkFish)) {
            const normal = rock.getCollisionNormal(sharkFish);
            const pushDistance = sharkFish.radius + rock.collisionRadius - Math.sqrt((sharkFish.x - rock.x - rock.width/2)**2 + (sharkFish.y - rock.y - rock.height/2)**2);
            sharkFish.x += normal.x * pushDistance;
            sharkFish.y += normal.y * pushDistance;

            // Reflect velocity
            const dot = sharkFish.dx * normal.x + sharkFish.dy * normal.y;
            sharkFish.dx -= 2 * dot * normal.x;
            sharkFish.dy -= 2 * dot * normal.y;
        }
        sharkFish.draw(ctx, sharkFishImage);
        
        if (sharkFish.catchFish(fish)) {
            alert("Game Over! The SharkFish caught you!");
            resetGame();
            return;
        }
    }

    let octopusesCaught = 0;

    console.log("Number of octopuses:", octopuses.length);

    for (let i = octopuses.length - 1; i >= 0; i--) {
        const octopus = octopuses[i];
        octopus.move(fish, rock);
        octopus.draw(ctx);

        // Remove the temporary debug visual
        // ctx.beginPath();
        // ctx.arc(octopus.x, octopus.y, 5, 0, Math.PI * 2);
        // ctx.fillStyle = 'red';
        // ctx.fill();
        // ctx.closePath();

        if (fish.catchOctopus(octopus)) {
            score++;
            octopusesCaught++;
            octopuses.splice(i, 1);
            
            if (score % 10 === 0) {
                level++;
                if (score === 10) {
                    sharkFish = new SharkFish(canvas, fish.speed);
                }
            }
        }
    }

    if (score > 4) {
        const newOctopusCount = Math.min(octopusesCaught * 2, 8 - octopuses.length);
        for (let i = 0; i < newOctopusCount; i++) {
            octopuses.push(new Octopus(canvas));
        }
    }

    while (octopuses.length < 3) {
        octopuses.push(new Octopus(canvas));
    }

    while (octopuses.length > 8) {
        octopuses.pop();
    }

    displayScore();

    requestAnimationFrame(gameLoop);
}

function displayScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Level: ${level}`, 10, 60);
    ctx.fillText(`Octopuses: ${octopuses.length}`, 10, 90);
    if (score < 10) {
        ctx.fillText(`SharkFish appears at 10 points`, 10, 120);
    }
}

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

window.addEventListener('resize', () => {
    setupCanvas();
    fish.x = canvas.width / 2;
    fish.y = canvas.height / 2;
});

window.addEventListener('load', loadImages);