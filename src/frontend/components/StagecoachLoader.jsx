import React, { useEffect, useState } from 'react';
import stagecoachSprite from '../assets/stagecoach_spritesheet.png';
import './StagecoachLoader.css';

const StagecoachLoader = ({ message = "Fetching suggestions...", isFinished, onComplete }) => {
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isFinished) {
            setAnimationClass('finished');
            // Wait for driveAway animation (1s) to complete
            const timer = setTimeout(() => {
                if (onComplete) onComplete();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isFinished, onComplete]);

    return (
        <div className={`stagecoach-wrapper ${animationClass === 'finished' ? 'loader-fade-out' : ''}`}>
            {/* Background image is handled via inline style to use the imported asset path correcty */}
            <div
                className={`stagecoach-container ${animationClass}`}
                style={{ backgroundImage: `url(${stagecoachSprite})` }}
            >
            </div>

            <p style={{
                marginTop: '16px',
                color: 'var(--ds-text-subtle, #6B778C)',
                fontSize: '14px',
                fontWeight: 500,
                textAlign: 'center'
            }}>
                {message}
            </p>
        </div>
    );
};

export default StagecoachLoader;
