import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import SuggestionList from './components/SuggestionList';
import SkeletonLoader from './components/SkeletonLoader';
import './App.css';

const App = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        // Fetch suggestions on mount
        invoke('getSuggestions')
            .then((data) => {
                setSuggestions(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load suggestions:', err);
                setError('Failed to load suggestions. Please try again.');
                setLoading(false);
            });
    }, []);

    const handleApply = async (suggestion) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await invoke('applySuggestion', { suggestion: suggestion.text });
            setSuccessMessage(`Applied suggestion: "${suggestion.title}"`);
        } catch (err) {
            console.error('Failed to apply suggestion:', err);
            setError('Failed to apply suggestion.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>AI Suggest</h1>

            {loading && <SkeletonLoader />}

            {error && <div className="error-container">{error}</div>}

            {successMessage && !loading && (
                <div className="success-container">
                    {successMessage}
                    <div style={{ marginTop: '10px' }}>
                        <button className="apply-button" onClick={() => setSuccessMessage(null)}>Back to suggestions</button>
                    </div>
                </div>
            )}

            {!loading && !error && !successMessage && (
                <SuggestionList suggestions={suggestions} onApply={handleApply} />
            )}
        </div>
    );
};

export default App;
