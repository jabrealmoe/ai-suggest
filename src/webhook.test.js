import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webhook } from './index';
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

describe('Webhook Trigger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
            body: JSON.stringify(validPayload)
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
            body: [{ output: JSON.stringify(innerData) }]
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
        const req = { body: JSON.stringify(invalidPayload) };

        const response = await webhook(req);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toContain('Missing issue key');
    });

    it('should return 500 when JSON parsing fails', async () => {
        const req = { body: "{ invalid json " };

        const response = await webhook(req);

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).error).toContain('Invalid JSON body');
    });
});
