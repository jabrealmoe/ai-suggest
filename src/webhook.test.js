import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webhook, WEBHOOK_SECRET_HEADER } from './index';
import * as forgeApi from '@forge/api';

// Mock @forge/api
vi.mock('@forge/api', () => {
  return {
    storage: {
      set: vi.fn(),
      get: vi.fn()
    },
    default: {
      fetch: vi.fn()
    },
    // Adding named export for route if needed by index.js imports, 
    // though webhook doesn't strictly use it, the module import might check it.
    route: (parts, ...args) => parts[0] 
  };
});

// Secret used by the tests. The real value lives in an encrypted Forge variable.
const TEST_SECRET = 'test-shared-secret';

// Forge passes header values as arrays of strings.
const authHeaders = { [WEBHOOK_SECRET_HEADER]: [TEST_SECRET] };

describe('Webhook Trigger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.WEBHOOK_SHARED_SECRET = TEST_SECRET;
    });

    afterEach(() => {
        delete process.env.WEBHOOK_SHARED_SECRET;
    });

    describe('shared secret check', () => {
        const body = JSON.stringify({ key: 'TEST-1', suggestions: [{ summary: 'S', description: 'D' }] });

        it('should return 401 when the secret header is missing', async () => {
            const response = await webhook({ body, headers: {} });

            expect(response.statusCode).toBe(401);
            expect(forgeApi.storage.set).not.toHaveBeenCalled();
        });

        it('should return 401 when the secret header is wrong', async () => {
            const response = await webhook({ body, headers: { [WEBHOOK_SECRET_HEADER]: ['wrong'] } });

            expect(response.statusCode).toBe(401);
            expect(forgeApi.storage.set).not.toHaveBeenCalled();
        });

        it('should return 503 when no secret is configured', async () => {
            delete process.env.WEBHOOK_SHARED_SECRET;

            const response = await webhook({ body, headers: authHeaders });

            expect(response.statusCode).toBe(503);
            expect(forgeApi.storage.set).not.toHaveBeenCalled();
        });

        it('should accept the header as a plain string with mixed-case name', async () => {
            const response = await webhook({ body, headers: { 'X-Dr-Jira-Secret': TEST_SECRET } });

            expect(response.statusCode).toBe(200);
        });
    });

    it('should return header values as arrays, as Forge requires', async () => {
        // Forge answers the caller with a 424 if any header value is a plain string.
        const responses = [
            await webhook({ body: JSON.stringify({ key: 'T-1', suggestions: [{ summary: 'S' }] }), headers: authHeaders }),
            await webhook({ body: JSON.stringify({ suggestions: [] }), headers: authHeaders }),
            await webhook({ body: '{ bad', headers: authHeaders }),
            await webhook({ body: '{}', headers: {} })
        ];

        for (const response of responses) {
            for (const value of Object.values(response.headers)) {
                expect(Array.isArray(value)).toBe(true);
            }
        }
    });

    it('should successfully parse a valid payload and store suggestions', async () => {
        const validPayload = {
            key: 'TEST-123',
            suggestions: [
                { summary: 'Suggestion 1', description: 'Desc 1', llm: 'GPT-4' }
            ]
        };

        // Simulate incoming request with stringified body
        const req = {
            body: JSON.stringify(validPayload),
            headers: authHeaders
        };

        const response = await webhook(req);

        expect(response.statusCode).toBe(200);
        expect(forgeApi.storage.set).toHaveBeenCalledTimes(1);
        
        // Verify storage key and content
        // The first argument should be 'suggestions-TEST-123'
        expect(forgeApi.storage.set).toHaveBeenCalledWith(
            'suggestions-TEST-123',
            expect.arrayContaining([
                expect.objectContaining({
                    title: 'Suggestion 1',
                    llm: 'GPT-4',
                    description: 'Desc 1'
                })
            ])
        );
    });

    it('should handle payload wrapped in array/output from n8n', async () => {
        // n8n output structure: [{ output: stringified_json }]
        const innerData = {
            key: 'TEST-456',
            summary: 'My Summary',
            description: 'My Description'
        };
        
        const req = {
            // body passed as object (array) because sometimes Forge passes parsed body?
            // The code handles payload = body directly/string check.
            body: [{ output: JSON.stringify(innerData) }],
            headers: authHeaders
        };

        const response = await webhook(req);

        expect(response.statusCode).toBe(200);
        expect(forgeApi.storage.set).toHaveBeenCalledWith(
            'suggestions-TEST-456',
            expect.any(Array) 
        );
    });

    it('should return 400 if issue key is missing', async () => {
        const invalidPayload = {
            suggestions: []
        };
        const req = { body: JSON.stringify(invalidPayload), headers: authHeaders };

        const response = await webhook(req);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toContain('Missing issue key');
    });

    it('should return 500 when JSON parsing fails', async () => {
        const req = { body: "{ invalid json ", headers: authHeaders };

        const response = await webhook(req);

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).error).toContain('Invalid JSON body');
    });
});
