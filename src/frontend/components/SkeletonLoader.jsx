import React from 'react';
import '../App.css'; // Ensure CSS is available

const SkeletonLoader = () => {
    return (
        <div className="suggestion-list">
            {[1, 2, 3].map((item) => (
                <div key={item} className="suggestion-card skeleton-card">
                    <div className="suggestion-header">
                        <div className="skeleton skeleton-title"></div>
                        <div className="skeleton skeleton-badge"></div>
                    </div>
                    <div className="skeleton skeleton-text"></div>
                    <div className="skeleton skeleton-text short"></div>
                    <div className="skeleton skeleton-button"></div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
