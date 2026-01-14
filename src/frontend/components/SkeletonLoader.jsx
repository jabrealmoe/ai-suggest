import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = () => {
    // Render 3 skeleton cards to simulate a list
    return (
        <div className="skeleton-container">
            {[1, 2, 3].map((item) => (
                <div key={item} className="skeleton-card">
                    <div className="skeleton-line skeleton-title"></div>
                    <div className="skeleton-line skeleton-text"></div>
                    <div className="skeleton-line skeleton-text-short"></div>
                    <div className="skeleton-line skeleton-button"></div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
