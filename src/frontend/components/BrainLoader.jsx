import React, { useEffect, useState } from 'react';
import './BrainLoader.css';

const BrainLoader = ({ isFinished, onComplete }) => {
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isFinished) {
            setAnimationClass('finished');
            const timer = setTimeout(() => {
                onComplete();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isFinished, onComplete]);

    return (
        <div className={`brain-loader-container ${animationClass}`}>
            <div className="brain-svg-container">
                <svg viewBox="0 0 100 100" className="brain-svg">
                    {/* Brain Outline/Circuitry Background */}
                    <path
                        className="brain-path-bg"
                        d="M30,70 Q20,65 20,50 Q20,30 40,20 Q60,10 80,30 Q90,40 90,60 Q90,80 70,85 Q60,90 50,85 Q40,90 30,70 Z"
                    />

                    {/* Internal Circuitry Details */}
                    <path
                        className="brain-internal"
                        d="M40,20 Q45,40 30,50 M50,25 Q60,45 50,60 M65,25 Q75,35 70,55 M30,70 Q40,60 50,70 M70,85 Q65,70 80,60"
                    />

                    {/* The Pulse Path - duplicates main paths but animated */}
                    <path
                        className="brain-pulse"
                        d="M30,70 Q20,65 20,50 Q20,30 40,20 Q60,10 80,30 Q90,40 90,60 Q90,80 70,85 Q60,90 50,85 Q40,90 30,70 Z M40,20 Q45,40 30,50 M50,25 Q60,45 50,60 M65,25 Q75,35 70,55 M30,70 Q40,60 50,70 M70,85 Q65,70 80,60"
                    />
                </svg>

                {/* Glow effect center */}
                <div className="brain-glow"></div>
            </div>

            <div className="loading-text">
                {isFinished ? "Neural Network Synchronized!" : "Processing Neural Signals..."}
            </div>
        </div>
    );
};

export default BrainLoader;
