import React, { useState, useEffect } from 'react';
import OvenLoader from './OvenLoader';
import MagicLoader from './MagicLoader';
import PlantLoader from './PlantLoader';
import LightbulbLoader from './LightbulbLoader';
import CoffeeLoader from './CoffeeLoader';

const loaders = [
    OvenLoader,
    MagicLoader,
    PlantLoader,
    LightbulbLoader,
    CoffeeLoader
];

const RandomLoader = (props) => {
    const [SelectedLoader, setSelectedLoader] = useState(null);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * loaders.length);
        setSelectedLoader(() => loaders[randomIndex]);
    }, []);

    if (!SelectedLoader) {
        return null; // or a simple spinner just in case
    }

    return <SelectedLoader {...props} />;
};

export default RandomLoader;
