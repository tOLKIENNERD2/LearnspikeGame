console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};

// Add a debug flag
const DEBUG = true;

// Add these new variables
let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10; // Changed from 2 to 10

let obstacleImage;
let obstacle;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage.width / backgroundImage.height;
    const maxWidth = window.innerWidth * 0.7;
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
    
    level2BackgroundImage = new Image();
    level2BackgroundImage.src = 'Level2.png';
    
    fishImage = new Image();
    fishImage.src = 'Fish1.png';
    
    otherFishImage = new Image();
    otherFishImage.src = 'Fish2.png'; // Use a different fish image for level 2
    
    sharkFishImage = new Image();
    sharkFishImage.src = 'Monsterfish.png';
    
    obstacleImage = new Image();
    obstacleImage.src = 'Obstacle.png'; // Add an image for the obstacle
    
    const images = [
        { img: backgroundImage, name: 'background' },
        { img: level2BackgroundImage, name: 'level2Background' },
        { img: fishImage, name: 'fish' },
        { img: otherFishImage, name: 'otherFish' },
        { img: sharkFishImage, name: 'sharkFish' },
        { img: obstacleImage, name: 'obstacle' }
    ];

    return Promise.all(images.map(({ img, name }) => 
        new Promise((resolve, reject) => {
            img.onload = () => {
                console.log(`${name} image loaded successfully`);
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load ${name} image`);
                reject(`Failed to load ${name} image`);
            };
        })
    )).then(() => {
        console.log("All images loaded successfully");
        initGame();
    }).catch(error => {
        console.error("Error loading images:", error);
        // Attempt to start the game anyway
        initGame();
    });
}

function drawBackground() {
    if (level === 1 && backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else if (level === 2 && level2BackgroundImage) {
        ctx.drawImage(level2BackgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function createObstacle() {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: 100,
        height: 100,
        draw: function(ctx) {
            if (obstacleImage) {
                ctx.drawImage(obstacleImage, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            } else {
                ctx.fillStyle = 'gray';
                ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            }
        },
        checkCollision: function(fish) {
            return fish.x + fish.radius > this.x - this.width/2 &&
                   fish.x - fish.radius < this.x + this.width/2 &&
                   fish.y + fish.radius > this.y - this.height/2 &&
                   fish.y - fish.radius < this.y + this.height/2;
        }
    };
}

function createOtherFish() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 25,
        speed: 1.5 + Math.random() * 0.5,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        draw: function(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.atan2(this.dy, this.dx));
            ctx.drawImage(otherFishImage, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        },
        move: function() {
            this.x += this.dx * this.speed;
            this.y += this.dy * this.speed;
            if (this.x < 0 || this.x > canvas.width) this.dx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.dy *= -1;
            
            // Avoid the obstacle
            if (obstacle.checkCollision(this)) {
                this.dx *= -1;
                this.dy *= -1;
            }
        }
    };
}

function initGame() {
    console.log("Initializing game");
    setupCanvas();
    if (!canvas || !ctx) {
        console.error("Canvas or context is not available");
        return;
    }
    fish = new Fish(canvas.width / 4, canvas.height / 2);
    octopuses = [new Octopus(canvas), new Octopus(canvas), new Octopus(canvas)];
    sharkFish = null;
    obstacle = createObstacle();
    console.log("Game initialized - Canvas size:", canvas.width, "x", canvas.height);
    gameLoop();
}

function resetGame() {
    debug("Resetting game");
    score = 0;
    level = 1;
    fish = new Fish(canvas.width / 4, canvas.height / 2);
    octopuses = [new Octopus(canvas), new Octopus(canvas), new Octopus(canvas)];
    sharkFish = null;
    obstacle = createObstacle();
    debug("Game reset - Octopuses:", octopuses.length, "Score:", score);
    gameLoop();  // Add this line to restart the game loop
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = []; // Remove all octopi
    debug("Level 2 reached via hack!");
}

function gameLoop() {
    console.log("Game loop running");
    try {
        if (!canvas || !ctx) {
            console.error("Canvas or context is not available in game loop");
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackground();
        
        // Move fish based on pressed keys or touch controls
        if (keys.ArrowLeft || fish.touchLeft) fish.accelerate('left');
        if (keys.ArrowRight || fish.touchRight) fish.accelerate('right');
        if (keys.ArrowUp || fish.touchUp) fish.accelerate('up');
        if (keys.ArrowDown || fish.touchDown) fish.accelerate('down');

        fish.move(canvas);
        if (fishImage) {
            fish.draw(ctx, fishImage);
        } else {
            console.warn("Fish image not loaded, using fallback");
            fish.drawFallback(ctx);
        }

        if (level === 1) {
            // Level 1 logic (octopi)
            for (let i = octopuses.length - 1; i >= 0; i--) {
                const octopus = octopuses[i];
                octopus.move(fish);
                octopus.draw(ctx);

                if (fish.catchOctopus(octopus)) {
                    score++;
                    octopuses.splice(i, 1);
                    debug("Octopus caught - New score:", score, "Octopuses left:", octopuses.length);
                    
                    if (score >= OCTOPI_TO_LEVEL_2) {
                        goToLevelTwo();
                    }
                }
            }

            // Spawn new octopuses
            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            // Level 2 logic (other fish and obstacle)
            obstacle.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move();
                fish2.draw(ctx);

                if (fish.catchOctopus(fish2)) { // Reuse catchOctopus method for simplicity
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            // Spawn new other fish
            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            // Check collision with obstacle
            if (obstacle.checkCollision(fish)) {
                fish.dx *= -1;
                fish.dy *= -1;
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y);
            if (sharkFishImage) {
                sharkFish.draw(ctx, sharkFishImage);
            } else {
                console.warn("SharkFish image not loaded, using fallback");
                sharkFish.drawFallback(ctx);
            }
            
            if (sharkFish.catchFish(fish)) {
                gameOver();
                return;
            }
        }

        // Ensure score is valid
        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        // Limit the maximum score to prevent unexpected behavior
        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
        // Don't call resetGame here, as it might cause an infinite loop
    }

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('The SharkFish caught you!', canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 80);
    
    canvas.addEventListener('click', resetGame, { once: true });
}

function displayScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    if (level === 1) {
        ctx.fillText(`Octopuses: ${octopuses ? octopuses.length : 0}`, 10, 60);
        ctx.fillText(`Catch ${OCTOPI_TO_LEVEL_2} octopi to reach Level 2`, 10, 90);
    } else if (level === 2) {
        ctx.fillText(`Other Fish: ${otherFish ? otherFish.length : 0}`, 10, 60);
        ctx.fillText(`Level 2 - Catch fish and avoid the obstacle!`, 10, 90);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 120);
    }
}

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyZ') {
        goToLevelTwo();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

window.addEventListener('resize', () => {
    setupCanvas();
    fish.x = canvas.width / 2;
    fish.y = canvas.height / 2;
});

window.addEventListener('load', () => {
    loadImages();
    setupTouchControls();
    // Add error handling for unexpected errors
    window.addEventListener('error', function(event) {
        console.error("Global error:", event.error);
        resetGame();
    });
});

function setupTouchControls() {
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'touchControls';
    controlsContainer.style.position = 'fixed';
    controlsContainer.style.right = '20px';
    controlsContainer.style.top = '50%';
    controlsContainer.style.transform = 'translateY(-50%)';
    controlsContainer.style.width = '120px';
    controlsContainer.style.height = '120px';
    controlsContainer.style.borderRadius = '50%';
    controlsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    controlsContainer.style.touchAction = 'none';
    controlsContainer.style.zIndex = '1000';

    const joystick = document.createElement('div');
    joystick.style.position = 'absolute';
    joystick.style.width = '60px';
    joystick.style.height = '60px';
    joystick.style.borderRadius = '50%';
    joystick.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    joystick.style.left = '50%';
    joystick.style.top = '50%';
    joystick.style.transform = 'translate(-50%, -50%)';

    controlsContainer.appendChild(joystick);
    document.body.appendChild(controlsContainer);

    let active = false;
    let startX, startY;

    function handleStart(e) {
        e.preventDefault();
        active = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    }

    function handleMove(e) {
        if (!active) return;
        e.preventDefault();

        const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.min(50, Math.hypot(deltaX, deltaY));

        const joystickX = Math.cos(angle) * distance;
        const joystickY = Math.sin(angle) * distance;

        joystick.style.transform = `translate(calc(-50% + ${joystickX}px), calc(-50% + ${joystickY}px))`;

        // Use separate variables for touch controls
        fish.touchLeft = joystickX < -10;
        fish.touchRight = joystickX > 10;
        fish.touchUp = joystickY < -10;
        fish.touchDown = joystickY > 10;
    }

    function handleEnd(e) {
        e.preventDefault();
        active = false;
        joystick.style.transform = 'translate(-50%, -50%)';
        fish.touchLeft = fish.touchRight = fish.touchUp = fish.touchDown = false;
    }

    controlsContainer.addEventListener('mousedown', handleStart);
    controlsContainer.addEventListener('touchstart', handleStart);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);

    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
}

console.log("Game.js fully loaded");