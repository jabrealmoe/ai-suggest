import React from 'react';

const SuggestionItem = ({ suggestion, onApply, onViewDetails }) => {
    return (
        <div className="suggestion-card" onClick={() => onViewDetails && onViewDetails(suggestion)}>
            <div className="suggestion-header">
                <h3 className="suggestion-title">{suggestion.title}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {suggestion.llm && <span className="suggestion-llm">{suggestion.llm}</span>}
                    {/* The model's own 0-100 estimate of how the rewritten ticket would
                        score on the quality rubric. Hidden when the model didn't send one. */}
                    {typeof suggestion.score === 'number' && (
                        <span
                            className="suggestion-score"
                            title="Model's own estimate of this rewrite's quality score (0-100), using the same rubric that scored the original ticket"
                        >
                            Quality {suggestion.score}/100
                        </span>
                    )}
                </div>
            </div>
            <p className="suggestion-description">{suggestion.description}</p>
            <button
                className="apply-button"
                onClick={(e) => {
                    e.stopPropagation();
                    onApply(suggestion);
                }}
            >
                Apply Suggestion
            </button>
        </div>
    );
};

export default SuggestionItem;
