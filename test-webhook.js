
// fast-mock of Forge API
const mockStorage = {
    set: async (key, value) => {
        console.log(`[Storage] Set ${key}:`, JSON.stringify(value, null, 2));
        return Promise.resolve();
    }
};

// Mock module registry
const modules = {
    '@forge/api': { storage: mockStorage },
    './resolvers': { handler: {} }
};

// Mock require
const originalRequire = module.require;
const fs = require('fs');
const path = require('path');

// We need to load src/index.js but intercept @forge/api
// Since we are in node environment, we can just read the file and eval it with mocks
// or simpler: just write a test that imports the function if it was a commonjs module.
// But it uses ES modules 'import/export'. 
// I'll write a script that reads src/index.js, strips the imports, 
// and wraps it in a function I can call with mocks.

const runTest = async () => {
    try {
        const indexPath = path.join(__dirname, 'src/index.js');
        let indexContent = fs.readFileSync(indexPath, 'utf8');

        // Remove imports
        indexContent = indexContent.replace(/import .* from .*/g, '');
        indexContent = indexContent.replace(/export { handler } .*/g, '');

        // Remove export const webhook... make it just const webhook
        indexContent = indexContent.replace('export const webhook', 'const webhook');

        // Append execution logic
        const testScript = `
            const storage = {
                set: async (key, val) => {
                    console.log('STORAGE_SET', key, JSON.stringify(val));
                }
            };
            
            ${indexContent}

            (async () => {
                const payload = [
                  {
                    "output": "{\\"key\\":\\"GS-64\\",\\"summary\\":\\"Enhance AI Search Functionality\\",\\"description\\":{\\"type\\":\\"doc\\",\\"version\\":1,\\"content\\":[{\\"type\\":\\"paragraph\\",\\"content\\":[{\\"type\\":\\"text\\",\\"text\\":\\"The objective of this story is to enhance the artificial intelligence (AI) search functionality.\\"}]}]}}"
                  }
                ];

                const req = { body: payload };
                console.log('Testing webhook...');
                const result = await webhook(req);
                console.log('Result:', result);
            })();
        `;

        eval(testScript);

    } catch (e) {
        console.error(e);
    }
};

runTest();
