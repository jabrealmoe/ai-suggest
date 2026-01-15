import React, { useState, useEffect } from 'react';
import './BrainLoader.css';
import ProceduralBrain from './ProceduralBrain';

const BrainLoader = () => {
    const [loadingText, setLoadingText] = useState('Analyzing Context...');

    const messages = [
        'Analyzing Context...',
        'Connecting Neurons...',
        'Pattern Matching...',
        'Synthesizing Insights...',
        'Optimizing Workflow...'
    ];

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % messages.length;
            setLoadingText(messages[index]);
        }, 2000); // Rotate text every 2s

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="brain-loader-container">
            {/* 3D Procedural Brain */}
            <ProceduralBrain />

            <div className="loading-text">
                {loadingText}
            </div>
        </div>
    );
};

export default BrainLoader;
