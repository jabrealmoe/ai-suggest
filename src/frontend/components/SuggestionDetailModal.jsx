import React from 'react';
import './SuggestionDetailModal.css';

const SuggestionDetailModal = ({ suggestion, onClose, onApply, isApplying }) => {
    const [displayedText, setDisplayedText] = React.useState('');
    const fullText = (typeof suggestion?.originalDescription === 'string' && suggestion.originalDescription)
        ? suggestion.originalDescription
        : suggestion?.description || '';

    React.useEffect(() => {
        if (!fullText) return;

        setDisplayedText(''); // Reset on new suggestion
        let index = 0;

        const timer = setInterval(() => {
            if (index < fullText.length) {
                setDisplayedText((prev) => prev + fullText.charAt(index));
                index++;
            } else {
                clearInterval(timer);
            }
        }, 15); // Adjust speed here (ms per char)

        return () => clearInterval(timer);
    }, [fullText]);

    if (!suggestion) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{suggestion.title}</h2>
                    <span className="modal-score">{suggestion.score}% Match</span>
                </div>

                <div className="modal-body">
                    <div className="modal-description typing-effect">
                        {displayedText}
                        <span className="cursor-blink">|</span>
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
