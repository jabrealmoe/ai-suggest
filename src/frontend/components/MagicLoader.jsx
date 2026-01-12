import React, { useEffect, useState } from 'react';
import './MagicLoader.css';

const MagicLoader = ({ isFinished, onComplete }) => {
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isFinished) {
            setAnimationClass('finished');
            const timer = setTimeout(() => {
                onComplete();
            }, 1000); // Poof duration
            return () => clearTimeout(timer);
        }
    }, [isFinished, onComplete]);

    return (
        <div className={`magic-loader-container ${animationClass}`}>
            <div className="hat"></div>
            <div className="wand"></div>

            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>

            {animationClass === 'finished' && <div className="poof-cloud"></div>}


        </div>
    );
};

export default MagicLoader;
