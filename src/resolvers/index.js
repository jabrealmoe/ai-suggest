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

  /* Improved Markdown to ADF Converter */
  let contentNodes = [];
  const rawDesc = suggestion.originalDescription || suggestion.description || " ";
  
  if (isADF) {
     const descPayload = suggestion.originalDescription;
     if (descPayload.content) {
       contentNodes = descPayload.content;
     } else {
       contentNodes = [{ type: "paragraph", content: [{ type: "text", text: "Invalid ADF" }] }];
     }
  } else {
    // Parser state
    const lines = rawDesc.split(/\r?\n/);
    contentNodes = [];
    
    let currentList = null;

    // Sections that should be treated as Headers if found as plain text
    const sectionHeaders = [
        'Objective', 'Business Justification', 'Technical or Operational Details',
        'Acceptance Criteria', 'Dependencies/Risks', 'Risk/Dependencies', 'Risks', 'Dependencies'
    ];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (!line) continue;
        
        // Helper regex matching
        const isHeader = (text) => {
             const clean = text.replace(/^\*\*|\*\*$/g, '').replace(/:$/, '').trim().toLowerCase();
             return sectionHeaders.some(h => h.toLowerCase() === clean);
        };

        // 1. Check for Explicit Markdown Header (### Title)
        if (line.startsWith('###')) {
            if (currentList) { contentNodes.push(currentList); currentList = null; }
            const text = line.replace(/^#{1,6}\s+/, '');
            contentNodes.push({
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: text }]
            });
            continue;
        }

        // 2. Check for Implicit Header
        const headerMatch = line.match(/^([^:]+):$/);
        if (headerMatch && isHeader(headerMatch[1])) {
             if (currentList) { contentNodes.push(currentList); currentList = null; }
             const cleanText = line.replace(/^\*\*|\*\*$/g, '').replace(/:$/, '');
             contentNodes.push({
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: cleanText }]
            });
            continue;
        }

        // 3. Check for List Item
        if (line.startsWith('* ') || line.startsWith('- ')) {
            const text = line.substring(2).trim();
            if (!currentList) {
                currentList = { type: 'bulletList', content: [] };
            }
            currentList.content.push({
                type: 'listItem',
                content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: text }]
                }]
            });
            continue;
        }

        // 4. Default Paragraph
        if (currentList) { contentNodes.push(currentList); currentList = null; }
        contentNodes.push({
            type: 'paragraph',
            content: [{ type: 'text', text: line }]
        });
    }
    // Final cleanup
    if (currentList) contentNodes.push(currentList);
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

