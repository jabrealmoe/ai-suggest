import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import SuggestionList from './components/SuggestionList';
import RandomLoader from './components/RandomLoader'; // Used to be OvenLoader
import SuggestionDetailModal from './components/SuggestionDetailModal';
import './App.css';

const App = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true); // Initial data loading state
    const [showLoader, setShowLoader] = useState(true); // Controls Animation visibility
    const [isApplying, setIsApplying] = useState(false); // Controls Apply action state
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null); // Detail view state

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 20; // Poll for ~1 minute (20 * 3s)
        let timer;

        const checkSuggestions = () => {
            invoke('getSuggestions')
                .then((data) => {
                    // Only finish if we found suggestions
                    if (data && data.length > 0) {
                        setSuggestions(data);
                        setLoading(false); // Triggers "done" state in RandomLoader
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        timer = setTimeout(checkSuggestions, 3000); // Retry in 3s
                    } else {
                        // Timeout - show empty list or error
                        setLoading(false);
                        // Note: suggestions is [] by default, so it will show empty list
                        console.log("Polling timed out, no suggestions found.");
                    }
                })
                .catch((err) => {
                    console.error('Failed to load suggestions:', err);
                    setError('Failed to load suggestions. Please try again.');
                    setLoading(false);
                    setShowLoader(false);
                });
        };

        checkSuggestions();

        return () => clearTimeout(timer);
    }, []);

    const handleLoaderComplete = () => {
        setShowLoader(false); // Animation finished, unmount Loader and show content
    };

    const handleApply = async (suggestion) => {
        if (!suggestion || !suggestion.id) {
            console.error("Suggestion is missing ID", suggestion);
            setError("Internal error: Invalid suggestion data.");
            return;
        }

        setIsApplying(true);
        setError(null);

        // Close modal if open
        const wasModalOpen = !!selectedSuggestion;

        try {
            console.log("Sending payload: { suggestionId }", suggestion.id);
            await invoke('applySuggestion', { suggestionId: suggestion.id });

            // If applied successfully from modal, close it
            if (wasModalOpen) {
                setSelectedSuggestion(null);
            }

            setSuccessMessage(`Applied suggestion: "${suggestion.title}"`);
        } catch (err) {
            console.error('Failed to apply suggestion:', err);
            setError('Failed to apply suggestion.');
            // Don't close modal on error so they can try again maybe? 
            // Or maybe keep it open.
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="container">


            {/* Random Animation for Initial Load */}
            {showLoader ? (
                <RandomLoader isFinished={!loading} onComplete={handleLoaderComplete} />
            ) : (
                <>
                    {/* Error State */}
                    {error && <div className="error-container">{error}</div>}

                    {/* Applying Overlay (Simple Spinner for Apply Action) */}
                    {isApplying && (
                        <div className="applying-overlay">
                            <div className="spinner"></div>
                            <p>Applying...</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && !isApplying && (
                        <div className="success-container">
                            {successMessage}
                            <div style={{ marginTop: '10px' }}>
                                <button className="apply-button" onClick={() => setSuccessMessage(null)}>Back to suggestions</button>
                            </div>
                        </div>
                    )}

                    {/* Suggestion List */}
                    {!error && !successMessage && !isApplying && (
                        <SuggestionList
                            suggestions={suggestions}
                            onApply={handleApply}
                            onViewDetails={setSelectedSuggestion}
                        />
                    )}

                    {/* Detail Modal */}
                    {selectedSuggestion && (
                        <SuggestionDetailModal
                            suggestion={selectedSuggestion}
                            onClose={() => !isApplying && setSelectedSuggestion(null)}
                            onApply={handleApply}
                            isApplying={isApplying}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default App;
