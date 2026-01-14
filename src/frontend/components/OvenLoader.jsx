import React, { useEffect, useState } from 'react';
import './OvenLoader.css';

const OvenLoader = ({ isFinished, onComplete }) => {
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isFinished) {
            setAnimationClass('finished');
            // Wait for serve-pie animation (1.5s + 0.3s delay = 1.8s)
            const timer = setTimeout(() => {
                onComplete();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isFinished, onComplete]);

    return (
        <div className={`oven-loader-container ${animationClass}`}>
            <div className="oven">
                <div className="stove-top">
                    <div className="burner"></div>
                    <div className="burner"></div>
                </div>
                <div className="oven-door">
                    <div className="oven-window">
                        <div className="oven-glow"></div>
                    </div>
                    <div className="handle" style={{
                        position: 'absolute', top: '10px', left: '20%', right: '20%', height: '4px', background: '#888', borderRadius: '2px'
                    }}></div>
                </div>

                {/* Pie lives here initially */}
                {/* Bread Loaf lives here initially */}
                <div className="bread-loaf">
                    <div className="loaf-top">
                        <div className="score-mark s1"></div>
                        <div className="score-mark s2"></div>
                        <div className="score-mark s3"></div>
                    </div>
                    <div className="loaf-bottom"></div>

                    <div className="bread-steam" style={{ animationDelay: '0s' }}></div>
                    <div className="bread-steam" style={{ animationDelay: '1s', left: '40%' }}></div>
                    <div className="bread-steam" style={{ animationDelay: '0.5s', left: '60%' }}></div>
                </div>
            </div>


        </div>
    );
};

export default OvenLoader;
