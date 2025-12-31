import React from 'react';

const SuggestionItem = ({ suggestion, onApply }) => {
    return (
        <div className="suggestion-card" onClick={() => onApply(suggestion)}>
            <div className="suggestion-header">
                <h3 className="suggestion-title">{suggestion.title}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {suggestion.llm && <span className="suggestion-llm">{suggestion.llm}</span>}
                    <span className="suggestion-score">{suggestion.score}% Match</span>
                </div>
            </div>
            <p className="suggestion-description">{suggestion.description}</p>
            <button className="apply-button">Apply Suggestion</button>
        </div>
    );
};

export default SuggestionItem;
