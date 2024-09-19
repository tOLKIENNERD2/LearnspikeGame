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
    
    fishImage = new Image();
    fishImage.src = 'Fish1.png';
    
    sharkFishImage = new Image();
    sharkFishImage.src = 'Monsterfish.png';
    
    const images = [
        { img: backgroundImage, name: 'background' },
        { img: fishImage, name: 'fish' },
        { img: sharkFishImage, name: 'sharkFish' }
    ];

    Promise.all(images.map(({ img, name }) => 
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
    if (!canvas || !ctx) {
        console.error("Canvas or context is not available");
        return;
    }
    fish = new Fish(canvas.width / 4, canvas.height / 2);
    octopuses = [new Octopus(canvas), new Octopus(canvas), new Octopus(canvas)];
    sharkFish = null;
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
    debug("Game reset - Octopuses:", octopuses.length, "Score:", score);
    gameLoop();  // Add this line to restart the game loop
}

function gameLoop() {
    console.log("Game loop running");
    try {
        if (!canvas || !ctx) {
            console.error("Canvas or context is not available in game loop");
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (backgroundImage) {
            drawBackground();
        } else {
            console.warn("Background image not loaded, using fallback");
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
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

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y);
            if (sharkFishImage) {
                sharkFish.draw(ctx, sharkFishImage);
            } else {
                console.warn("SharkFish image not loaded, using fallback");
                sharkFish.drawFallback(ctx);
            }
            
            if (sharkFish.catchFish(fish)) {
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
                return;
            }
        }

        let octopusesCaught = 0;
        let previousScore = score; // Add this line to track score changes

        debug("Before octopus loop - Octopuses:", octopuses.length, "Score:", score);

        if (!Array.isArray(octopuses) || octopuses.length === 0) {
            console.error("Octopuses array is invalid. Reinitializing...");
            octopuses = [new Octopus(canvas), new Octopus(canvas), new Octopus(canvas)];
        }

        for (let i = octopuses.length - 1; i >= 0; i--) {
            const octopus = octopuses[i];
            if (!octopus || typeof octopus.move !== 'function' || typeof octopus.draw !== 'function') {
                console.error("Invalid octopus at index", i, "Removing...");
                octopuses.splice(i, 1);
                continue;
            }
            octopus.move(fish);
            octopus.draw(ctx);

            if (fish.catchOctopus(octopus)) {
                score++;
                octopusesCaught++;
                octopuses.splice(i, 1);
                debug("Octopus caught - New score:", score, "Octopuses left:", octopuses.length);
            }
        }

        if (score !== previousScore) {
            debug(`Score changed from ${previousScore} to ${score}`);
        }

        debug("After octopus loop - Octopuses:", octopuses.length, "Score:", score);

        // Spawn new octopuses
        const baseOctopusCount = 3;
        const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
        const newOctopusCount = Math.max(octopusesCaught, maxOctopuses - octopuses.length);
        
        debug("Spawning new octopuses:", newOctopusCount, "Max octopuses:", maxOctopuses);

        for (let i = 0; i < newOctopusCount; i++) {
            octopuses.push(new Octopus(canvas));
        }

        debug("After spawning - Octopuses:", octopuses.length, "Score:", score);

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

function displayScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Octopuses: ${octopuses ? octopuses.length : 0}`, 10, 60);
    if (!sharkFish) {
        ctx.fillText(`SharkFish appears at 5 points`, 10, 90);
    } else {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 90);
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