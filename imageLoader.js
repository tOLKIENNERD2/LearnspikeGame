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
        })
        .catch(error => {
            console.error("Error loading images:", error);
            window.backgroundImage = { width: 800, height: 600 };
        });
}

export { loadImages };