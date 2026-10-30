import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pollForSuggestions, POLL_INTERVAL_MS, MAX_POLL_ATTEMPTS } from './pollSuggestions';

// Lets pending promise callbacks run between fake-timer steps.
const flush = () => new Promise((resolve) => setImmediate(resolve));

// Advances fake time by one poll interval and lets the next request settle.
const nextPoll = async () => {
    vi.advanceTimersByTime(POLL_INTERVAL_MS);
    await flush();
};

describe('pollForSuggestions', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('waits about 3 minutes in total', () => {
        expect(POLL_INTERVAL_MS * MAX_POLL_ATTEMPTS).toBe(180000);
    });

    it('keeps polling past the old 1-minute limit and returns suggestions when they arrive', async () => {
        const suggestions = [{ id: '1', title: 'Better ticket' }];
        // Empty for ~75 seconds (25 checks), then suggestions appear: the old
        // 20-attempt limit would have given up before this.
        let calls = 0;
        const fetchSuggestions = vi.fn(async () => (++calls > 25 ? suggestions : []));
        const onFound = vi.fn();
        const onTimeout = vi.fn();

        pollForSuggestions({ fetchSuggestions, onFound, onTimeout, onError: vi.fn() });
        await flush();
        for (let i = 0; i < 25; i++) await nextPoll();

        expect(onFound).toHaveBeenCalledWith(suggestions);
        expect(onTimeout).not.toHaveBeenCalled();
        expect(fetchSuggestions).toHaveBeenCalledTimes(26);
    });

    it('gives up after the last attempt', async () => {
        const fetchSuggestions = vi.fn(async () => []);
        const onTimeout = vi.fn();

        pollForSuggestions({ fetchSuggestions, onFound: vi.fn(), onTimeout, onError: vi.fn() });
        await flush();
        for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) await nextPoll();

        expect(onTimeout).toHaveBeenCalledTimes(1);
        // One first check plus MAX_POLL_ATTEMPTS retries.
        expect(fetchSuggestions).toHaveBeenCalledTimes(MAX_POLL_ATTEMPTS + 1);
    });

    it('stops polling when cancelled', async () => {
        const fetchSuggestions = vi.fn(async () => []);
        const stop = pollForSuggestions({ fetchSuggestions, onFound: vi.fn(), onTimeout: vi.fn(), onError: vi.fn() });
        await flush();
        stop();
        for (let i = 0; i < 5; i++) await nextPoll();

        expect(fetchSuggestions).toHaveBeenCalledTimes(1);
    });

    it('reports request errors', async () => {
        const onError = vi.fn();
        pollForSuggestions({
            fetchSuggestions: vi.fn(async () => { throw new Error('boom'); }),
            onFound: vi.fn(),
            onTimeout: vi.fn(),
            onError,
        });
        await flush();

        expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
});
