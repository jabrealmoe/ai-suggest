export { handler } from './resolvers';
import { storage } from '@forge/api';

export const webhook = async (req) => {
    try {
        const { body } = req;
        // Parse the body if it's a string
        const payload = typeof body === 'string' ? JSON.parse(body) : body;

        // The n8n payload is an array with an 'output' property containing stringified JSON
        // Example: [{ "output": "{\"key\":\"GS-64\", ...}" }]
        const item = Array.isArray(payload) ? payload[0] : payload;

        let data;
        if (item && item.output && typeof item.output === 'string') {
            data = JSON.parse(item.output);
        } else {
            // Fallback if it's already the object
            data = item;
        }

        const { key, summary, description } = data;

        if (!key || !description) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Missing key or description in payload' })
            };
        }

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

        const suggestion = {
            id: Date.now().toString(), // unique ID for the suggestion
            title: summary || 'AI Suggestion',
            description: descriptionPreview,
            originalDescription: description, // Store full ADF
            llm: 'n8n AI Agent',
            score: 95 // hardcoded for now or extract if available
        };

        // Save to Forge Storage using Issue Key (e.g. GS-64)
        // Note: We overwrite existing suggestions for this issue for this simple version
        await storage.set(`suggestions-${key}`, [suggestion]);

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
