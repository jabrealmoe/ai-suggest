import Resolver from '@forge/resolver';
import api, { route, storage } from '@forge/api';

const resolver = new Resolver();

resolver.define('getSuggestions', async (req) => {
  const { extension } = req.context;
  const issueKey = extension.issue.key;

  if (!issueKey) {
    console.warn('No issue Key found in context');
    return [];
  }

  // Fetch suggestions from Forge Storage using Key
  const suggestions = await storage.get(`suggestions-${issueKey}`);

  // Filter based on minScore if configured
  const appConfig = await storage.get('appConfig');
  if (appConfig && appConfig.minScore && suggestions) {
    return suggestions.filter(s => {
      // Assuming 'score' is a percentage in string "85%" or number
      let scoreVal = 0;
      if (typeof s.score === 'string') {
        scoreVal = parseInt(s.score.replace('%', ''));
      } else {
        scoreVal = s.score;
      }
      return scoreVal >= appConfig.minScore;
    });
  }

  if (!suggestions) {
    // Return empty or default if nothing stored yet
    return [];
  }

  return suggestions;
});

resolver.define('getAppConfig', async (req) => {
  const config = await storage.get('appConfig');
  return config || { minScore: 0, modelName: 'Default', n8nUrl: '' };
});

resolver.define('testN8nConnection', async (req) => {
  const { url, apiKey } = req.payload;
  if (!url) {
    throw new Error("URL is required");
  }

  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await api.fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        test: true,
        message: "Hello from Dr. Jira settings!",
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      return { success: true, status: response.status };
    } else {
      return { success: false, status: response.status, statusText: response.statusText };
    }
  } catch (error) {
    console.error("Test connection failed:", error);
    throw new Error(`Connection failed: ${error.message}`);
  }
});

resolver.define('saveAppConfig', async (req) => {
  await storage.set('appConfig', req.payload);
  return { success: true };
});

resolver.define('applySuggestion', async (req) => {
  console.log("applySuggestion payload:", JSON.stringify(req.payload));
  const { suggestionId } = req.payload;
  const { extension } = req.context;
  const issueId = extension.issue.id;
  const issueKey = extension.issue.key;

  if (!suggestionId) {
    throw new Error("suggestionId is required in payload");
  }

  if (!issueId || !issueKey) {
    throw new Error('Could not determine issue ID or Key from context.');
  }

  // Fetch suggestions from storage to get the full object
  const storedSuggestions = await storage.get(`suggestions-${issueKey}`);

  if (!storedSuggestions || !Array.isArray(storedSuggestions)) {
    throw new Error(`No suggestions found for issue ${issueKey}`);
  }

  const suggestion = storedSuggestions.find(s => s.id === suggestionId);

  if (!suggestion) {
    throw new Error(`Suggestion with ID ${suggestionId} not found for issue ${issueKey}`);
  }

  console.log("Found suggestion to apply:", JSON.stringify(suggestion).substring(0, 100));

  // Build the new issue description in Atlassian Document Format (ADF),
  // the JSON format Jira's v3 REST API requires for rich-text fields.
  //
  // Suggestions arrive in one of two shapes:
  //  - An ADF object (older single-suggestion payloads): use it as-is.
  //  - A plain string (current n8n payloads): wrap each line in a paragraph.
  const original = suggestion.originalDescription;
  const isADF = Boolean(original) && typeof original === 'object' && Array.isArray(original.content);

  let descriptionPayload;

  if (isADF) {
    descriptionPayload = original;
  } else {
    // Fall back to the short preview if the full text is missing.
    const rawDesc = String(original || suggestion.description || ' ');

    // Some models double-escape line breaks, so the text contains a literal
    // backslash followed by "n" instead of a real newline. Turn those into
    // real newlines so Jira doesn't show "\n" in the description.
    const normalized = rawDesc.replace(/\\r\\n|\\n/g, '\n');

    // One ADF paragraph per line. Empty lines become empty paragraphs,
    // which Jira shows as spacing between sections.
    const contentNodes = normalized.split(/\r?\n/).map((line) => (
      line.trim()
        ? { type: 'paragraph', content: [{ type: 'text', text: line }] }
        : { type: 'paragraph', content: [] }
    ));

    descriptionPayload = {
      type: 'doc',
      version: 1,
      content: contentNodes
    };
  }

  const bodyData = {
    fields: {
      description: descriptionPayload
    }
  };

  console.log("Constructed bodyData being sent to Jira:", JSON.stringify(bodyData));

  if (suggestion.summary) {
    bodyData.fields.summary = suggestion.summary;
  }

  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueId}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyData)
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Jira API Error: ${response.status} ${err}`);
    throw new Error(`Failed to update issue: ${response.statusText}`);
  }

  // --- Track LLM Usage Stats ---
  try {
    const usedLlm = suggestion.llm || 'Unknown Model';
    // key for storing stats
    const STATS_KEY = 'llm-usage-stats';
    // Get current stats
    let stats = await storage.get(STATS_KEY) || {};
    // Increment count
    if (stats[usedLlm]) {
      stats[usedLlm]++;
    } else {
      stats[usedLlm] = 1;
    }
    // Save back
    await storage.set(STATS_KEY, stats);
    console.log(`Update stats for JJ: ${JSON.stringify(stats)}`);
  } catch (statsErr) {
    console.error("Failed to update LLM stats:", statsErr);
  }

  return { success: true };
});

resolver.define('getLlmUsageStats', async (req) => {
  const stats = await storage.get('llm-usage-stats') || {};
  return stats;
});


resolver.define('getAllStorage', async (req) => {
  const { cursor, limit = 10 } = req.payload || {};
  
  // Use storage.query() with pagination
  // We use getMany() which efficiently retrieves keys and values together.
  // This satisfies the requirement to retrieve values for each key.
  const data = await storage.query()
    .limit(limit)
    .cursor(cursor)
    .getMany();

  return {
    results: data.results,
    nextCursor: data.nextCursor
  };
});

const handler = resolver.getDefinitions();


export { handler };

