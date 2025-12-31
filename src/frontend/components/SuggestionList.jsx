import React from 'react';
import SuggestionItem from './SuggestionItem';

const SuggestionList = ({ suggestions, onApply }) => {
    return (
        <div className="suggestion-list">
            {suggestions.map((suggestion, index) => (
                <SuggestionItem
                    key={index}
                    suggestion={suggestion}
                    onApply={onApply}
                />
            ))}
        </div>
    );
};

export default SuggestionList;
