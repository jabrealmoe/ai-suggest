/**
 * Polls for AI suggestions until they arrive or we give up.
 *
 * Why polling: when an issue is created, Forge sends it to n8n, three models
 * write suggestions, and n8n posts them back to our web trigger. That round
 * trip has taken a little over a minute in practice, so the panel keeps
 * asking the backend until suggestions show up.
 */

// Ask every 3 seconds...
export const POLL_INTERVAL_MS = 3000;
// ...for about 3 minutes (60 x 3s), well past the ~1 minute a run takes.
export const MAX_POLL_ATTEMPTS = 60;

/**
 * Starts polling.
 *
 * @param {object} options
 * @param {() => Promise<Array>} options.fetchSuggestions  Returns the current suggestions (empty array if none yet).
 * @param {(suggestions: Array) => void} options.onFound    Called once when suggestions arrive.
 * @param {() => void} options.onTimeout                    Called if none arrive in time.
 * @param {(error: Error) => void} options.onError          Called if a request fails.
 * @param {number} [options.intervalMs]                     Wait between attempts.
 * @param {number} [options.maxAttempts]                    Retries after the first check.
 * @returns {() => void} A function that stops polling (call it when the panel unmounts).
 */
export const pollForSuggestions = ({
    fetchSuggestions,
    onFound,
    onTimeout,
    onError,
    intervalMs = POLL_INTERVAL_MS,
    maxAttempts = MAX_POLL_ATTEMPTS,
}) => {
    let attempts = 0;
    let timer = null;
    let stopped = false;

    const check = () => {
        fetchSuggestions()
            .then((data) => {
                if (stopped) return;
                if (data && data.length > 0) {
                    onFound(data);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    timer = setTimeout(check, intervalMs);
                } else {
                    onTimeout();
                }
            })
            .catch((err) => {
                if (!stopped) onError(err);
            });
    };

    check();

    return () => {
        stopped = true;
        clearTimeout(timer);
    };
};
