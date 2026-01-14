export { handler } from './resolvers';
import api, { storage, route } from '@forge/api';

export const webhook = async (req) => {
    console.log("Webhook triggered");
    try {
        const { body } = req;
        console.log("Raw body type:", typeof body);
        console.log("Raw body length:", body ? body.length : "null");

        // Parse the body if it's a string
        let payload;
        try {
            payload = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (e) {
            console.error("JSON parse error:", e);
            throw new Error("Invalid JSON body");
        }

        const payloadStr = JSON.stringify(payload);
        console.log("Parsed payload preview:", payloadStr.substring(0, 500));

        // The n8n payload is an array with an 'output' property containing stringified JSON
        // Example: [{ "output": "{\"key\":\"GS-64\", ...}" }]
        const item = Array.isArray(payload) ? payload[0] : payload;

        let data;
        if (item && item.output && typeof item.output === 'string') {
            try {
                data = JSON.parse(item.output);
            } catch (parseErr) {
                console.error("Error parsing inner output JSON:", parseErr);
                data = item; // fallback
            }
        } else {
            // Fallback if it's already the object
            // CHECK FOR NESTED BODY (Common in some HTTP clients)
            if (item && item.body && typeof item.body === 'object') {
                console.log("Detected nested 'body' property, using it as data root.");
                data = item.body;
            } else {
                data = item || {};
            }
        }

        const { key, summary, description, suggestions } = data;
        console.log(`Processing for Issue Key: ${key}`);

        if (!key) {
            console.warn("Missing key in data:", JSON.stringify(data).substring(0, 200));
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Missing issue key in payload' })
            };
        }

        let suggestionsToStore = [];

        if (suggestions && Array.isArray(suggestions)) {
            // map the new payload format
            suggestionsToStore = suggestions.map((s, index) => {
                // Create a plain text preview from the ADF description if needed
                // The user payload seems to send plain text description in the new format 
                // based on the example: "description": "**Objective:** ..."
                // We should probably treat it as markdown or text. 

                let descPreview = s.description;
                if (typeof s.description === 'string' && s.description.length > 100) {
                    descPreview = s.description.substring(0, 100) + '...';
                }

                return {
                    id: Date.now().toString() + '-' + index,
                    title: s.summary || 'AI Suggestion',
                    summary: s.summary, // Store the specific summary for application
                    description: descPreview,
                    originalDescription: s.description, // Store the full content
                    llm: s.llm || 'AI Agent',
                    score: 95 // placeholder
                };
            });
        } else if (description) {
            // Fallback for previous single suggestion format
            // Create a plain text preview from the ADF description for the UI
            let descriptionPreview = "Updated description available";
            try {
                if (description.content && Array.isArray(description.content)) {
                    // simple extraction of first paragraph text
                    const firstPara = description.content.find(n => n.type === 'paragraph');
                    if (firstPara && firstPara.content && firstPara.content[0] && firstPara.content[0].text) {
                        descriptionPreview = firstPara.content[0].text;
                        if (descriptionPreview.length > 100) {
                            descriptionPreview = descriptionPreview.substring(0, 100) + '...';
                        }
                    }
                }
            } catch (e) {
                console.error("Error extracting preview", e);
            }

            suggestionsToStore.push({
                id: Date.now().toString(),
                title: summary || 'AI Suggestion',
                summary: summary,
                description: descriptionPreview,
                originalDescription: description,
                llm: 'n8n AI Agent',
                score: 95
            });
        } else {
            console.warn("Missing description/suggestions");
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Missing description or suggestions in payload' })
            };
        }

        console.log(`Storing ${suggestionsToStore.length} suggestions for ${key}`);

        // Save to Forge Storage using Issue Key (e.g. GS-64)
        try {
            await storage.set(`suggestions-${key}`, suggestionsToStore);
            console.log("Storage set successful");
        } catch (storageError) {
            console.error("Storage set failed:", storageError);
            throw storageError;
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, message: `Stored suggestion for issue ${key}` })
        };
    } catch (error) {
        console.error('Webhook error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal Server Error: ' + error.message })
        };
    }
};

// Export trigger function for Product Events
export const trigger = async (event) => {
    console.log("Trigger fired", JSON.stringify(event));

    // Get configuration from Storage OR Environment Variables
    const appConfig = await storage.get('appConfig') || {};

    // Config precedence: Admin Page > Environment Variable
    const N8N_WEBHOOK_URL = appConfig.n8nUrl || process.env.N8N_WEBHOOK_URL;
    const WEBTRIGGER_API_KEY = appConfig.n8nApiKey || process.env.WEBTRIGGER_API_KEY;

    if (!N8N_WEBHOOK_URL) {
        console.error('⚠️ N8N_WEBHOOK_URL is not configured (checked Admin Page and Env Vars). Skipping webhook call.');
        console.error('   To fix: Configure in "Dr. Jira Settings" OR "Run forge variables set N8N_WEBHOOK_URL <url> -e <environment>"');
        return;
    }

    const { issue } = event;
    if (!issue) {
        console.warn("No issue data in event");
        return;
    }

    // Check for "Service request with approvals" and set Due Date
    try {
        if (issue.fields && issue.fields.issuetype && issue.fields.issuetype.name === 'Service request with approvals') {
            console.log("Detected 'Service request with approvals'. Setting Due Date to +7 days.");

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            const formattedDate = dueDate.toISOString().split('T')[0];

            await api.asApp().requestJira(route`/rest/api/3/issue/${issue.key}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        duedate: formattedDate
                    }
                })
            });
            console.log(`Due Date set to ${formattedDate} for issue ${issue.key}`);
        }
    } catch (err) {
        console.error("Error setting due date:", err);
    }

    const issueKey = issue.key;
    const description = issue.fields.description;
    console.log(`Preparing to send to n8n - Issue: ${issueKey}`);

    try {
        console.log('Calling n8n webhook... ✌🏾');
        // Mask the URL in logs to protect the path/query params if sensitive
        const maskedUrl = N8N_WEBHOOK_URL.replace(/(\?|&)([^=]+)=([^&]+)/g, '$1$2=***');
        console.log(`Target URL: ${maskedUrl}`);

        const n8nResponse = await api.fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WEBTRIGGER_API_KEY || ''}`
            },
            body: JSON.stringify({
                // Send original issue data to n8n
                issueKey: issue.key,
                issueId: issue.id,
                summary: issue.fields.summary,
                description: description,
                project: {
                    id: issue.fields.project?.id,
                    key: issue.fields.project?.key,
                    name: issue.fields.project?.name
                },
                issueType: {
                    id: issue.fields.issuetype?.id,
                    name: issue.fields.issuetype?.name
                },
                reporter: {
                    accountId: issue.fields.reporter?.accountId,
                    displayName: issue.fields.reporter?.displayName,
                    emailAddress: issue.fields.reporter?.emailAddress
                },
                status: {
                    id: issue.fields.status?.id,
                    name: issue.fields.status?.name
                },
                created: issue.fields.created,
                updated: issue.fields.updated,
                dueDate: issue.fields.duedate,
                // Include the full event for maximum flexibility
                fullEvent: event,
                // Include context information (note: context might not be fully available in async trigger like UI resolver)
                timestamp: new Date().toISOString()
            })
        });

        if (n8nResponse.ok) {
            const n8nData = await n8nResponse.json().catch(() => n8nResponse.text());
            console.log('Successfully sent data to n8n:', JSON.stringify(n8nData).substring(0, 100));

            // Store the N8N response data in Forge storage for the UI panel to display
            // Only store if we got valid JSON data (not text)
            if (typeof n8nData === 'object' && n8nData !== null) {
                try {
                    await storage.set(`quality-${issueKey}`, n8nData);
                    console.log(`Stored quality data for issue ${issueKey}`);
                } catch (storageError) {
                    console.error('Error storing quality data:', storageError);
                    // Don't fail the entire process if storage fails
                }
            }
        } else {
            const errorText = await n8nResponse.text();
            let errorMessage;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorText;
                // Provide helpful message for common n8n errors
                if (n8nResponse.status === 404 && errorJson.message && errorJson.message.includes('not registered')) {
                    console.warn('⚠️ n8n webhook is not active. Please activate/publish your workflow in n8n.');
                    console.warn('   In test mode, webhooks only work for one call after clicking "Execute workflow".');
                    console.warn('   To fix: Go to your n8n workflow and click "Activate" to make it production-ready.');
                }
            } catch (e) {
                errorMessage = errorText;
            }
            console.error(`n8n webhook returned error (${n8nResponse.status} ${n8nResponse.statusText}):`, errorMessage);
        }
    } catch (n8nError) {
        // Don't fail the entire trigger if n8n call fails
        // Log it but continue execution
        console.error('Error calling n8n webhook:', n8nError);
    }
};
