console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    if (typeof Fish === 'undefined') {
        console.error('Fish class is not defined');
        return null;
    }
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    if (typeof Fish === 'undefined') {
        console.error('Fish class is not defined');
        return null;
    }
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    if (typeof Fish !== 'function') {
        console.error('Fish class is not defined or not a function');
        return null;
    }
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    if (typeof Fish !== 'function') {
        console.error('Fish class is not defined or not a function');
        return null;
    }
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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

function displayScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    if (level === 1) {
        ctx.fillText(`Octopuses: ${octopuses ? octopuses.length : 0}`, 10, 60);
        ctx.fillText(`Catch ${OCTOPI_TO_LEVEL_2} octopi to reach Level 2`, 10, 90);
    } else if (level === 2) {
        ctx.fillText(`Other Fish: ${otherFish ? otherFish.length : 0}`, 10, 60);
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
    window.addEventListener('error', function(event) {
        console.error("Global error:", event.error);
        resetGame();
    });
});

console.log("Game.js fully loaded");
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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


function createObstacle() {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: 100,
        height: 100,
        draw: function(ctx) {
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            // Use a default size for the canvas if images fail to load
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            // Use a default size for the canvas if images fail to load
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            // Use a default size for the canvas if images fail to load
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const aspectRatio = backgroundImage ? backgroundImage.width / backgroundImage.height : 4/3;
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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            // Use a default size for the canvas if images fail to load
            backgroundImage = { width: 800, height: 600 };
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
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, fishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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
console.log("Game.js loaded");

import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let canvas, ctx;
let backgroundImage, fishImage, sharkFishImage;
let fish, octopuses, sharkFish;
let score = 0;
let level = 1;
let keys = {};
let rock;

const DEBUG = true;

let level2BackgroundImage;
let otherFishImage;
let otherFish = [];
const OCTOPI_TO_LEVEL_2 = 10;

let obstacleImage;
let obstacle;

let squids = [];
const SQUIDS_TO_SPAWN = 3;

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
    const imageSources = {
        backgroundImage: 'Seaweed1.png',
        level2BackgroundImage: 'Level2.png',
        fishImage: 'Fish1.png',
        sharkFishImage: 'Monsterfish.png'
    };

    const imagePromises = Object.entries(imageSources).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`${key} loaded successfully`);
                resolve({key, img});
            };
            img.onerror = () => {
                console.error(`Failed to load ${key} from ${src}`);
                reject(`Failed to load ${key} from ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(imagePromises)
        .then(results => {
            results.forEach(({key, img}) => {
                window[key] = img;
            });
            console.log("All images loaded successfully");
            initGame();
        })
        .catch(error => {
            console.error("Error loading images:", error);
            // Use a default size for the canvas if images fail to load
            backgroundImage = { width: 800, height: 600 };
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
    return new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
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
    
    rock = new Rock(canvas);
    
    const gameState = {
        fish: [],
        sharkFish: null,
        score: 0
    };
    rock.initializeLevelElements(level, gameState);
    
    fish = gameState.fish[0] || fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
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
    gameLoop();
}

function goToLevelTwo() {
    level = 2;
    score = OCTOPI_TO_LEVEL_2;
    otherFish = Array(5).fill().map(() => createOtherFish());
    octopuses = [];
    squids = Array(SQUIDS_TO_SPAWN).fill().map(() => new Squid(canvas));
    
    const gameState = {
        fish: otherFish,
        sharkFish: null,
        score: score
    };
    rock.initializeLevelElements(level, gameState);
    
    otherFish = gameState.fish;
    sharkFish = gameState.sharkFish;
    score = gameState.score;
    
    debug("Level 2 reached!");
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

            const baseOctopusCount = 3;
            const maxOctopuses = Math.min(8, baseOctopusCount + Math.floor(score / 5));
            while (octopuses.length < maxOctopuses) {
                octopuses.push(new Octopus(canvas));
            }
        } else if (level === 2) {
            rock.draw(ctx);
            
            for (let i = otherFish.length - 1; i >= 0; i--) {
                const fish2 = otherFish[i];
                fish2.move(canvas);
                fish2.draw(ctx, otherFishImage);

                if (fish.catchOctopus(fish2)) {
                    score++;
                    otherFish.splice(i, 1);
                    debug("Other fish caught - New score:", score, "Other fish left:", otherFish.length);
                }
            }

            for (let i = squids.length - 1; i >= 0; i--) {
                const squid = squids[i];
                squid.move(fish.x, fish.y);
                squid.draw(ctx);

                if (fish.catchOctopus(squid)) {
                    score += 5;
                    squids.splice(i, 1);
                    debug("Squid caught - New score:", score, "Squids left:", squids.length);
                }
            }

            while (squids.length < SQUIDS_TO_SPAWN) {
                squids.push(new Squid(canvas));
            }

            const baseOtherFishCount = 5;
            const maxOtherFish = Math.min(10, baseOtherFishCount + Math.floor((score - OCTOPI_TO_LEVEL_2) / 5));
            while (otherFish.length < maxOtherFish) {
                otherFish.push(createOtherFish());
            }

            if (rock.checkCollision(fish)) {
                const normal = rock.getCollisionNormal(fish);
                const dotProduct = fish.dx * normal.x + fish.dy * normal.y;
                
                if (dotProduct < 0) {
                    fish.dx -= 2 * dotProduct * normal.x;
                    fish.dy -= 2 * dotProduct * normal.y;
                }
                
                const pushFactor = 1.5;
                fish.x += normal.x * pushFactor;
                fish.y += normal.y * pushFactor;
                
                fish.x = Math.max(fish.radius, Math.min(canvas.width - fish.radius, fish.x));
                fish.y = Math.max(fish.radius, Math.min(canvas.height - fish.radius, fish.y));
            }
        }

        if (sharkFish) {
            sharkFish.move(fish.x, fish.y, canvas);
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

        if (typeof score !== 'number' || isNaN(score)) {
            console.error("Score is invalid. Resetting to 0.");
            score = 0;
        }

        score = Math.min(score, 999);

        if (score >= 5 && !sharkFish) {
            sharkFish = new SimpleSharkFish(canvas);
            debug("SharkFish spawned!");
        }

        displayScore();

    } catch (error) {
        console.error("Error in game loop:", error);
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
        ctx.fillText(`Squids: ${squids ? squids.length : 0}`, 10, 90);
        ctx.fillText(`Level 2 - Catch fish and squids, avoid the rock!`, 10, 120);
    }
    if (sharkFish) {
        ctx.fillText(`Watch out for the SharkFish!`, 10, 150);
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