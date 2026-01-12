import React, { useEffect, useState } from 'react';
import './LightbulbLoader.css';

const LightbulbLoader = ({ isFinished, onComplete }) => {
    const [lit, setLit] = useState(false);

    useEffect(() => {
        if (isFinished) {
            setLit(true);
            const timer = setTimeout(() => {
                onComplete();
            }, 1500); // Shine duration
            return () => clearTimeout(timer);
        }
    }, [isFinished, onComplete]);

    return (
        <div className={`lightbulb-loader-container ${isFinished ? 'finished' : ''}`}>
            <div className="bulb-wrapper">
                <div className={`bulb ${lit ? 'lit' : 'flicker'}`}>
                    <div className="filament"></div>
                </div>
                <div className="base"></div>
            </div>

        </div>
    );
};

export default LightbulbLoader;
