# Model Routing System - Documentation

## Overview

The Model Routing System automatically selects the appropriate AI model for tasks based on task type and content. This ensures optimal performance by matching task requirements with model capabilities.

## Gateway Rules

| Task Type(s) | Model | Model Name | Capabilities |
|-------------|-------|------------|--------------|
| `backend`, `api`, `database`, `mobile` | `zai/glm-4.7` | GLM-4.7 | Code, backend, API, database, architecture |
| `design`, `ui`, `animation` | `qwen-portal/coder-model` | Qwen Coder | Code, design, UX, UI, frontend, components |
| `analysis`, `qa`, `review`, `logic` | `kimi-coding/kimi-k2-thinking` | Kimi K2.5 Thinking | Analysis, reasoning, logic, QA, code review |
| `general` (default) | `kimi-coding/k2p5` | Kimi K2.5 | General-purpose, balanced |

## Installation & Setup

### 1. Run the Setup Script

```bash
cd /home/admin/.openclaw/workspace/mission-control/scripts
./setup-model-routing.sh
```

This script will:
- Check gateway status
- Verify model configurations
- Validate routing setup
- Provide status summary

### 2. Verify Model Availability

```bash
openclaw models list
openclaw models status
openclaw agents list
```

### 3. Check Gateway Status

```bash
openclaw gateway status
openclaw gateway call sessions.list
```

## Usage

### API Endpoints

#### Get Model Routing Status

```bash
curl http://localhost:3000/api/model-routing?action=status
```

Response:
```json
{
  "success": true,
  "routing_config": {
    "backend": { "modelId": "zai/glm-4.7", "modelName": "GLM-4.7", ... },
    "design": { "modelId": "qwen-portal/coder-model", "modelName": "Qwen Coder", ... },
    ...
  },
  "validation": {
    "valid": true,
    "issues": [],
    "availableRoutes": [...]
  },
  "model_readiness": {
    "ready": true,
    "models": {
      "zai/glm-4.7": { "available": true, "ready": true, "message": "..." },
      ...
    }
  },
  "health_check": {
    "healthy": true,
    "checks": { "gateway": true, "modelsConfigured": true, "sessionsActive": true },
    "issues": []
  }
}
```

#### Get Routing for a Task

```bash
curl -X POST http://localhost:3000/api/model-routing \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Create REST API for user management",
    "description": "Build CRUD endpoints for users table"
  }'
```

Response:
```json
{
  "success": true,
  "routing": {
    "taskType": "api",
    "model": {
      "modelId": "zai/glm-4.7",
      "modelName": "GLM-4.7",
      "capabilities": ["code", "api", "rest", "graphql", "backend"],
      "reasoning": false
    },
    "confidence": 0.8
  }
}
```

#### Quick Health Check

```bash
curl http://localhost:3000/api/model-routing?action=health
```

#### Get Session Status

```bash
curl http://localhost:3000/api/model-routing?action=session-status
```

### Dispatch Task with Model Routing

When dispatching a task through the Mission Control UI, the system will:

1. **Analyze task content** (title and description)
2. **Determine task type** using keyword inference
3. **Select appropriate model** based on routing rules
4. **Include model context** in the task message
5. **Log routing decision** in the events log

Example task dispatch:
```
Title: "Create responsive login page with animations"

Inferred Type: ui + animation
Selected Model: qwen-portal/coder-model (Qwen Coder)
```

## Task Type Inference

The system infers task types by analyzing keywords in the task title and description:

### Backend/API/Database/Mobile
- **Keywords**: backend, server, api, endpoint, rest, graphql, microservice
- **Keywords**: database, sql, mongodb, postgres, schema, migration, orm
- **Keywords**: mobile, ios, android, react native, flutter, swift, kotlin

### Design/UI/Animation
- **Keywords**: design, ux, prototype, wireframe, mockup, user flow
- **Keywords**: ui, component, frontend, interface, css, tailwind, style
- **Keywords**: animation, transition, motion, framer, gsap, animate

### Analysis/QA/Review/Logic
- **Keywords**: analysis, analyze, research, investigate, audit
- **Keywords**: qa, quality, testing, test, verification, validation
- **Keywords**: review, code review, peer review, audit, assess
- **Keywords**: logic, algorithm, optimize, refactor, simplify, complex

## Programmatic Usage

### TypeScript

```typescript
import { 
  getModelRoutingForTask, 
  getModelIdForTask,
  type TaskType 
} from '@/lib/model-router';
import { 
  verifyModelReadiness,
  getRoutingInfo 
} from '@/lib/gateway-model-status';

// Get routing for a task
const routing = getModelRoutingForTask(
  'Create REST API for users',
  'Build CRUD endpoints with authentication'
);
console.log(routing.taskType); // 'api'
console.log(routing.model.modelId); // 'zai/glm-4.7'

// Get model ID for a specific type
const modelId = getModelIdForTask('backend');
console.log(modelId); // 'zai/glm-4.7'

// Verify model readiness
const readiness = await verifyModelReadiness();
console.log(readiness.ready); // true/false
console.log(readiness.models); // Map of model status

// Get routing info for a task type
const routingInfo = await getRoutingInfo('design');
console.log(routingInfo.recommendedModel); // 'qwen-portal/coder-model'
console.log(routingInfo.fallbackModel); // fallback model
```

### Shell Script

```bash
# Check model routing status
curl -s http://localhost:3000/api/model-routing?action=status | jq .

# Get routing for a specific task
curl -s -X POST http://localhost:3000/api/model-routing \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database schema migration",
    "description": "Update users table with new fields"
  }' | jq '.routing'

# Quick health check
curl -s http://localhost:3000/api/model-routing?action=health | jq '.health'
```

## Troubleshooting

### Gateway Not Running

```bash
# Check gateway status
openclaw gateway status

# Start gateway
openclaw gateway start

# Or run in foreground
openclaw gateway run
```

### Model Not Configured

```bash
# Check available models
openclaw models list

# Add missing models
openclaw models auth qwen-portal
openclaw models auth kimi-coding

# Set default model
openclaw models set kimi-coding/k2p5
```

### Authentication Issues

```bash
# Check auth profiles
cat ~/.openclaw/agents/main/agent/auth-profiles.json

# Re-authenticate if needed
openclaw models auth qwen-portal
openclaw models auth kimi-coding
```

### Session Issues

```bash
# List active sessions
openclaw gateway call sessions.list

# Check session history
openclaw gateway call sessions.history --params '{"session_id": "session-id"}'
```

## Configuration Files

### Models Configuration
- `~/.openclaw/agents/main/agent/models.json` - Available models
- `~/.openclaw/agents/main/agent/auth-profiles.json` - Authentication profiles

### OpenClaw Config
- `~/.openclaw/openclaw.json` - Main OpenClaw configuration

### Mission Control
- `src/lib/model-router.ts` - Routing logic
- `src/lib/gateway-model-status.ts` - Gateway status checks
- `src/app/api/model-routing/route.ts` - API endpoints

## Examples

### Example 1: Backend API Task

```
Title: "Create user authentication API"
Description: "Implement JWT-based authentication with refresh tokens"

→ Inferred Type: api
→ Selected Model: zai/glm-4.7 (GLM-4.7)
→ Capabilities: code, api, rest, backend
```

### Example 2: UI Design Task

```
Title: "Design responsive dashboard layout"
Description: "Create sidebar navigation with collapsible sections"

→ Inferred Type: ui
→ Selected Model: qwen-portal/coder-model (Qwen Coder)
→ Capabilities: ui, frontend, components
```

### Example 3: Code Review Task

```
Title: "Review payment processing code"
Description: "Audit security and error handling in payment module"

→ Inferred Type: review
→ Selected Model: kimi-coding/kimi-k2-thinking (Kimi K2.5 Thinking)
→ Capabilities: review, code-review, audit, analysis
```

### Example 4: Database Migration

```
Title: "Database migration for user profiles"
Description: "Add avatar_url, bio, and social_links columns"

→ Inferred Type: database
→ Selected Model: zai/glm-4.7 (GLM-4.7)
→ Capabilities: database, sql, schema
```

## Advanced Usage

### Custom Task Types

You can explicitly specify a task type when calling the routing API:

```bash
curl -X POST http://localhost:3000/api/model-routing \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Task",
    "description": "Task description",
    "task_type": "backend"
  }'
```

This will force the routing to use the `backend` model regardless of content analysis.

### Model Aliases

The system supports model aliases for convenience:

```typescript
// In model-router.ts
const MODEL_ALIASES = {
  'qwen': 'qwen-portal/coder-model',
  'glm': 'zai/glm-4.7',
  'kimi': 'kimi-coding/k2p5',
  'kimi-thinking': 'kimi-coding/kimi-k2-thinking',
};
```

## Monitoring

### Check Model Usage

```bash
# Get session status with model information
openclaw gateway call sessions.list --json | jq '.sessions[].model'

# Check gateway usage cost
openclaw gateway usage-cost
```

### Event Logging

Model routing decisions are logged in the Mission Control events table:

```sql
SELECT * FROM events 
WHERE type = 'task_dispatched' 
ORDER BY created_at DESC 
LIMIT 10;
```

Each dispatch event includes metadata with:
- `taskType`: Inferred task type
- `recommendedModel`: Selected model ID
- `modelName`: Human-readable model name
- `confidence`: Confidence score (0.5 - 0.9)

## Support

For issues or questions:

1. Check gateway status: `openclaw gateway status`
2. Run health check: `curl http://localhost:3000/api/model-routing?action=health`
3. Review logs: `openclaw logs`
4. Check documentation: https://docs.openclaw.ai
