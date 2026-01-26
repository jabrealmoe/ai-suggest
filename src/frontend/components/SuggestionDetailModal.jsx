import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import './SuggestionDetailModal.css';

const SuggestionDetailModal = ({ suggestion, onClose, onApply, isApplying }) => {
    const [displayedText, setDisplayedText] = React.useState('');
    const fullText = (typeof suggestion?.originalDescription === 'string' && suggestion.originalDescription)
        ? suggestion.originalDescription
        : suggestion?.description || '';

    // Helper to inject markdown headers for known sections if they are just plain text
    const formatDescription = (text) => {
        if (!text) return '';
        let formatted = text;
        
        // List of sections to format as H3
        const sections = [
            'Objective',
            'Business Justification',
            'Technical or Operational Details',
            'Acceptance Criteria',
            'Dependencies/Risks',
            'Risk/Dependencies'
        ];

        sections.forEach(section => {
            // Regex checks for Start of Line (or newline) followed by the Section Name and a colon
            // We replace it with ### Section Name:
            const regex = new RegExp(`(^|\\n)(${section}):`, 'g');
            formatted = formatted.replace(regex, '$1### $2:');
        });

        // Also ensure bullet points * without space become * space if needed? 
        // User example: "*   Identify..." -> This is valid markdown.
        // User example: "*   A documented..." -> Valid.
        
        return formatted;
    };

    const formattedFullText = useMemo(() => formatDescription(fullText), [fullText]);

    React.useEffect(() => {
        if (!formattedFullText) return;

        setDisplayedText(''); // Reset on new suggestion
        let index = 0;

        // Speed up the typing slightly for longer markdown content
        const timer = setInterval(() => {
            if (index < formattedFullText.length) {
                // Add chunks of characters to prevent breaking markdown syntax as much as possible?
                // No, simple char accumulation is smoothest, ReactMarkdown handles incomplete safely.
                setDisplayedText((prev) => prev + formattedFullText.charAt(index));
                index++;
            } else {
                clearInterval(timer);
            }
        }, 3); 

        return () => clearInterval(timer);
    }, [formattedFullText]);

    if (!suggestion) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{suggestion.title}</h2>
                </div>

                <div className="modal-body">
                    <div className="modal-description">
                        <ReactMarkdown>{displayedText}</ReactMarkdown>
                        {displayedText.length < formattedFullText.length && <span className="cursor-blink">|</span>}
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
