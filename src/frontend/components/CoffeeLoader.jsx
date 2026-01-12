import React, { useEffect, useState } from 'react';
import './CoffeeLoader.css';

const CoffeeLoader = ({ isFinished, onComplete }) => {
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isFinished) {
            setAnimationClass('finished');
            const timer = setTimeout(() => {
                onComplete();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isFinished, onComplete]);

    return (
        <div className={`coffee-loader-container ${animationClass}`}>
            <div className="drip-source">
                {!isFinished && <div className="drip"></div>}
            </div>

            <div className="mug">
                <div className="coffee-liquid"></div>
                {!isFinished && <div className="ripple"></div>}
            </div>

            {isFinished && (
                <div style={{ position: 'absolute', top: '50px' }}>
                    <div className="steam"></div>
                    <div className="steam"></div>
                    <div className="steam"></div>
                </div>
            )}


        </div>
    );
};

export default CoffeeLoader;
