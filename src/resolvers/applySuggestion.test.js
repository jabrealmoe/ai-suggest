import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture the functions registered with resolver.define() so we can call them directly.
const definitions = {};
vi.mock('@forge/resolver', () => ({
  default: class {
    define(name, fn) {
      definitions[name] = fn;
    }
    getDefinitions() {
      return definitions;
    }
  }
}));

// Mock Forge storage and the Jira API client.
const requestJira = vi.fn();
vi.mock('@forge/api', () => ({
  default: { asApp: () => ({ requestJira }) },
  route: (parts, ...args) => parts.reduce((acc, part, i) => acc + part + (args[i] ?? ''), ''),
  storage: { get: vi.fn(), set: vi.fn() }
}));

const { storage } = await import('@forge/api');
await import('./index');

// Request shape the UI sends: the suggestion ID plus the current issue in context.
const makeRequest = (suggestionId) => ({
  payload: { suggestionId },
  context: { extension: { issue: { id: '10001', key: 'GS-1' } } }
});

// Returns the JSON body sent to Jira's "edit issue" endpoint.
const sentBody = () => JSON.parse(requestJira.mock.calls[0][1].body);

describe('applySuggestion resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestJira.mockResolvedValue({ ok: true, text: async () => '' });
    // The stats lookup at the end reads storage too, so default to "nothing stored".
    storage.get.mockResolvedValue(undefined);
  });

  it('applies a plain-text suggestion as ADF paragraphs and updates the summary', async () => {
    storage.get.mockResolvedValueOnce([
      { id: 's1', summary: 'Better title', originalDescription: 'Objective:\nDo the thing', llm: 'Claude' }
    ]);

    const result = await definitions.applySuggestion(makeRequest('s1'));

    expect(result).toEqual({ success: true });
    const body = sentBody();
    expect(body.fields.summary).toBe('Better title');
    expect(body.fields.description).toEqual({
      type: 'doc',
      version: 1,
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Objective:' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Do the thing' }] }
      ]
    });
  });

  it('turns literal "\\n" sequences from double-escaped model output into line breaks', async () => {
    storage.get.mockResolvedValueOnce([
      { id: 's2', summary: 'T', originalDescription: 'Objective:\\nLine two', llm: 'Gemini' }
    ]);

    await definitions.applySuggestion(makeRequest('s2'));

    const texts = sentBody().fields.description.content.map((p) => p.content[0]?.text);
    expect(texts).toEqual(['Objective:', 'Line two']);
  });

  it('passes an ADF description through unchanged', async () => {
    const adf = { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ADF' }] }] };
    storage.get.mockResolvedValueOnce([{ id: 's3', summary: 'T', originalDescription: adf }]);

    await definitions.applySuggestion(makeRequest('s3'));

    expect(sentBody().fields.description).toEqual(adf);
  });

  it('throws a clear error when Jira rejects the update', async () => {
    storage.get.mockResolvedValueOnce([{ id: 's4', summary: 'T', originalDescription: 'x' }]);
    requestJira.mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request', text: async () => 'nope' });

    await expect(definitions.applySuggestion(makeRequest('s4'))).rejects.toThrow('Failed to update issue');
  });
});
