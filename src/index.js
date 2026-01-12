export { handler } from './resolvers';
import { storage } from '@forge/api';

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
