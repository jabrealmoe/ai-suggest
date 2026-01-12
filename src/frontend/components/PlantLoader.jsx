import React, { useEffect, useState } from 'react';
import './PlantLoader.css';

const PlantLoader = ({ isFinished, onComplete }) => {
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isFinished) {
            setAnimationClass('finished');

            // Wait for bloom animation + pause
            const timer = setTimeout(() => {
                onComplete();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isFinished, onComplete]);

    return (
        <div className={`plant-loader-container ${animationClass}`}>
            <div className="pot"></div>
            <div className="water-phase">
                <div className="watering-can">
                    <svg width="60" height="60" viewBox="0 0 100 100">
                        <path d="M10,40 h50 a10,10 0 0,1 10,10 v30 a10,10 0 0,1 -10,10 h-50 a10,10 0 0,1 -10,-10 v-30 a10,10 0 0,1 10,-10 z" fill="#A9A9A9" />
                        <path d="M70,50 l20,-10" stroke="#A9A9A9" strokeWidth="5" />
                        <circle cx="90" cy="40" r="5" fill="#A9A9A9" />
                        <path d="M20,40 v-20 h20" stroke="#A9A9A9" strokeWidth="5" fill="none" />
                    </svg>
                </div>
                <div className="water-droplets">
                    <div className="droplet"></div>
                    <div className="droplet"></div>
                    <div className="droplet"></div>
                </div>
            </div>

            <div className="stem">
                <div className="leaf left"></div>
                <div className="leaf right"></div>
                {isFinished && (
                    <div className="flower bloom">
                        {/* Simple flower SVG */}
                        <svg width="40" height="40" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="20" fill="#FFC0CB" />
                            <circle cx="50" cy="20" r="15" fill="#FF69B4" />
                            <circle cx="80" cy="50" r="15" fill="#FF69B4" />
                            <circle cx="50" cy="80" r="15" fill="#FF69B4" />
                            <circle cx="20" cy="50" r="15" fill="#FF69B4" />
                            <circle cx="50" cy="50" r="10" fill="#FFFF00" />
                        </svg>
                    </div>
                )}
            </div>


        </div>
    );
};

export default PlantLoader;
