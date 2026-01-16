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

  // Update the issue description
  // Check if originalDescription exists AND is an object (valid ADF). 
  // If it's a string (mapped from description in webhook), we must wrap it in ADF.
  const isADF = suggestion.originalDescription && typeof suggestion.originalDescription === 'object';

  /* New logic to convert string description to ADF with paragraphs */
  let contentNodes = [];
  const rawDesc = suggestion.originalDescription || suggestion.description || " ";

  if (isADF) {
    const descPayload = suggestion.originalDescription;
    // simple valid check
    if (descPayload.content) {
      contentNodes = descPayload.content;
    } else {
      // fallback
      contentNodes = [{ type: "paragraph", content: [{ type: "text", text: "Invalid ADF" }] }];
    }
  } else {
    // Split by newline and create separate paragraphs
    const lines = rawDesc.split(/\r?\n/);
    contentNodes = lines.map(line => {
      // If line is empty, we still want a paragraph (maybe with localId) or empty text? 
      // Jira ADF paragraph must have content unless it's just a spacer. 
      // Actually empty paragraph is allowed but might be invisible. 
      // Better: paragraph with " " if it's truly empty?
      // Let's just create a text node if line has content.
      if (!line.trim()) {
        return { type: "paragraph", content: [] };
      }
      return {
        type: "paragraph",
        content: [{ type: "text", text: line }]
      };
    });
  }

  const descriptionPayload = isADF ? suggestion.originalDescription : {
    type: "doc",
    version: 1,
    content: contentNodes
  };

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

  // Track LLM Usage Stats for Reporting
  try {
    const modelName = suggestion.llm || 'Unknown Model';
    const stats = await storage.get('llmUsageStats') || {};
    stats[modelName] = (stats[modelName] || 0) + 1;
    await storage.set('llmUsageStats', stats);
    console.log(`Updated stats for ${modelName}: ${stats[modelName]}`);
  } catch (e) {
    console.error("Failed to update usage stats", e);
    // Don't block the user action if analytics fail
  }

  return { success: true };
});

resolver.define('getLlmUsageStats', async (req) => {
  const stats = await storage.get('llmUsageStats');
  return stats || {};
});

const handler = resolver.getDefinitions();


export { handler };

