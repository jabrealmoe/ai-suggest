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

  if (!suggestions) {
    // Return empty or default if nothing stored yet
    return [];
  }

  return suggestions;
});

resolver.define('applySuggestion', async (req) => {
  const { suggestion } = req.payload;
  const { extension } = req.context;
  const issueId = extension.issue.id;

  if (!issueId) {
    throw new Error('Could not determine issue ID from context.');
  }

  // Update the issue description
  // suggestion.originalDescription contains the ADF object from n8n
  const descriptionPayload = suggestion.originalDescription || {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: suggestion.description // Fallback to plain text if ADF not found
          }
        ]
      }
    ]
  };

  const bodyData = {
    fields: {
      description: descriptionPayload
    }
  };

  // If summary was provided/changed, we could update it too. 
  // For now, let's just stick to description as per previous logic, 
  // but if suggestion.title is different we might want to update summary?
  // The user prompt only focused on description handling, so I'll stick to that 
  // to avoid side effects, unless explicitly asked.

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

  return { success: true };
});

const handler = resolver.getDefinitions();


export { handler };

