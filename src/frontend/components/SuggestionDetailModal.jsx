import React from 'react';
import './SuggestionDetailModal.css';

const SuggestionDetailModal = ({ suggestion, onClose, onApply, isApplying }) => {
    if (!suggestion) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{suggestion.title}</h2>
                    <span className="modal-score">{suggestion.score}% Match</span>
                </div>

                <div className="modal-body">
                    <div className="modal-description">
                        {suggestion.description}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="modal-cancel-btn" onClick={onClose} disabled={isApplying}>
                        Close
                    </button>
                    <button
                        className="modal-apply-btn"
                        onClick={() => onApply(suggestion)}
                        disabled={isApplying}
                    >
                        {isApplying ? 'Applying...' : 'Apply Suggestion'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuggestionDetailModal;
