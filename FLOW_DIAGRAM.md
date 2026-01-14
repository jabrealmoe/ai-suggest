# AI-Suggest Flow Diagram & Function Specifications

This document provides a comprehensive overview of the data flow, function inputs/outputs, and system architecture for the AI-Suggest Forge app.

## System Architecture Overview

```mermaid
graph TB
    subgraph "External System"
        N8N[n8n Automation Platform]
    end
    
    subgraph "Forge App - Backend"
        TRIGGER[Issue Event Trigger<br/>src/index.js]
        WEBHOOK[Webhook Handler<br/>src/index.js]
        RESOLVER[Resolvers<br/>src/resolvers/index.js]
        STORAGE[(Forge Key-Value Storage)]
    end
    
    subgraph "Forge App - Frontend"
        UI[React UI<br/>src/frontend/App.jsx]
        ADMIN[Admin Page<br/>src/frontend/components/AdminPage.jsx]
    end
    
    subgraph "Jira API"
        JIRA_API[Jira REST API]
    end
    
    JIRA_API -->|"Issue Created/Updated"| TRIGGER
    TRIGGER -->|"POST Payload<br/>(Issue Data)"| N8N
    N8N -->|"POST Webhook<br/>(AI Suggestions)"| WEBHOOK
    WEBHOOK -->|"Store suggestions"| STORAGE
    
    UI -->|"Poll for suggestions"| RESOLVER
    RESOLVER -->|"Read from"| STORAGE
    STORAGE -->|"Return suggestions"| RESOLVER
    RESOLVER -->|"Return to"| UI
    
    UI -->|"Apply Suggestion"| RESOLVER
    RESOLVER -->|"PUT Request"| JIRA_API
    
    ADMIN -->|"Save Config<br/>(API Key, URL)"| RESOLVER
    RESOLVER -->|"Persist Settings"| STORAGE
    TRIGGER -->|"Read Config"| STORAGE
```

## Data Flow: Issue Event Trigger (Jira → n8n)

```mermaid
sequenceDiagram
    participant JIRA as Jira Cloud
    participant TRIGGER as Forge Trigger
    participant STORAGE as Forge Storage
    participant N8N as n8n Platform
    
    JIRA->>TRIGGER: Issue Created / Updated
    activate TRIGGER
    TRIGGER->>STORAGE: get('appConfig')
    STORAGE-->>TRIGGER: { n8nUrl, n8nApiKey }
    
    alt URL Configured
        TRIGGER->>TRIGGER: Extract Issue Details
        TRIGGER->>N8N: POST /webhook<br/>Authorization: Bearer <API_KEY>
        N8N-->>TRIGGER: HTTP 200 OK
    else URL Missing
        TRIGGER->>TRIGGER: Log Warning & Skip
    end
    deactivate TRIGGER
```

## Data Flow: Webhook Response (n8n → Storage)

```mermaid
sequenceDiagram
    participant N8N as n8n Platform
    participant WH as Webhook Handler
    participant STORAGE as Forge Storage
    
    N8N->>WH: POST /webhook<br/>{ suggestions: [...] }
    activate WH
    WH->>WH: Parse payload
    WH->>WH: Create suggestion objects
    WH->>STORAGE: storage.set(`suggestions-${key}`, data)
    STORAGE-->>WH: Success
    WH-->>N8N: HTTP 200 OK
    deactivate WH
```

## Data Flow: Frontend & Admin (UI → Storage/Jira)

```mermaid
sequenceDiagram
    participant USER as User
    participant UI as React App
    participant ADMIN as Admin Page
    participant RESOLVER as Resolver Functions
    participant STORAGE as Forge Storage
    
    %% Admin Flow
    USER->>ADMIN: Open Dr. Jira Settings
    ADMIN->>RESOLVER: saveAppConfig(url, key)
    RESOLVER->>STORAGE: storage.set('appConfig')
    
    %% User Flow
    USER->>UI: Open Issue Panel
    loop Polling
        UI->>RESOLVER: getSuggestions()
        RESOLVER->>STORAGE: get(`suggestions-${key}`)
        STORAGE-->>UI: [Suggestion A, Suggestion B]
    end
    
    USER->>UI: Click "Apply"
    UI->>RESOLVER: applySuggestion(id)
    RESOLVER->>STORAGE: Get full ADF content
    RESOLVER->>JIRA_API: PUT /issue/{id}
    JIRA_API-->>UI: Success
```

## Configuration & Storage Keys

### Storage Keys
- `appConfig`: Stores global settings.
  ```json
  {
    "n8nUrl": "https://...",
    "n8nApiKey": "secret-key",
    "minScore": 80,
    "modelName": "GPT-4"
  }
  ```
- `suggestions-{issueKey}`: Stores the latest AI suggestions for a specific issue.
- `quality-{issueKey}`: Stores quality/metrics data (if applicable).

### Trigger Integration
- **Function:** `trigger` in `src/index.js`
- **Events:** `avi:jira:created:issue`, `avi:jira:updated:issue`
- **Logic:**
    1. Reads `appConfig` from storage.
    2. Fallback to process environment variables (`N8N_WEBHOOK_URL`).
    3. Sends full issue payload to the configured n8n URL.
