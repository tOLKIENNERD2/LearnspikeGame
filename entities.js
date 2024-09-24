import Fish from './Fish.js';
import Octopus from './Octopus.js';
import SimpleSharkFish from './SimpleSharkFish.js';
import Rock from './Rock.js';
import Squid from './Squid.js';

let fish, octopuses, sharkFish, rock, otherFish = [], squids = [];

function initializeEntities(canvas) {
    fish = new Fish(canvas.width / 4, canvas.height / 2);
    octopuses = [new Octopus(canvas), new Octopus(canvas), new Octopus(canvas)];
    sharkFish = null;
    rock = new Rock(canvas);
}

function updateEntities(ctx, level) {
    fish.move(canvas);
    fish.draw(ctx);

    if (level === 1) {
        updateOctopuses(ctx);
    } else if (level === 2) {
        updateLevel2Entities(ctx);
    }

    updateSharkFish(ctx);
}

function updateOctopuses(ctx) {
    // Octopus update logic
}

function updateLevel2Entities(ctx) {
    // Level 2 entities update logic
}

function updateSharkFish(ctx) {
    // SharkFish update logic
}

export { initializeEntities, updateEntities };