# AI Agent 007 - Quick Reference

## Quick Start

```bash
# 1. Navigate to the project
cd ai-agent-007

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Run the agent
npm start
```

## Project Structure at a Glance

```
ai-agent-007/
├── src/agent/         # 🤖 Core AI agent modules
├── src/tools/         # 🛠️  Helper tools
├── src/utils/         # 🔧 Common utilities
├── src/prompts/       # 💬 AI prompt templates
├── docs/              # 📚 Documentation
├── tests/             # 🧪 Test suites
├── examples/          # 📋 Usage examples
└── config/            # ⚙️  Configuration
```

## Workflow Diagram

```
┌─────────────────┐
│ User Input      │
│ (Requirements)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  1. PLANNER     │  Analyzes requirements
│                 │  Creates implementation plan
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. CODER       │  Generates code files
│                 │  Implements features
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. EXECUTOR    │  Runs code in sandbox
│                 │  Executes tests
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. REVIEWER    │  Checks quality
│                 │  Scans security
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │ Good?   │
    └─┬────┬──┘
  Yes │    │ No
      │    └──────┐
      │           │
      ▼           ▼
┌──────────┐  ┌────────────┐
│ OUTPUT   │  │ 5. ITERATE │
│ READY ✅ │  │ & IMPROVE  │
└──────────┘  └─────┬──────┘
                    │
                    └──────┐
                           │
                  Back to CODER
```

## Core Modules

| Module | Purpose | Location |
|--------|---------|----------|
| 🎯 **Orchestrator** | Coordinates workflow | `src/agent/orchestrator/` |
| 📋 **Planner** | Analyzes requirements | `src/agent/planner/` |
| 💻 **Coder** | Generates code | `src/agent/coder/` |
| ⚙️ **Executor** | Runs & tests code | `src/agent/executor/` |
| 🔍 **Reviewer** | Quality & security | `src/agent/reviewer/` |

## Common Commands

```bash
# Start the agent
npm start

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Configuration Files

| File | Purpose |
|------|---------|
| `.env` | API keys & environment variables |
| `config/agent.config.json` | Agent behavior settings |
| `package.json` | Node.js dependencies |

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...           # Your OpenAI API key

# Optional
OPENAI_MODEL=gpt-4-turbo-preview  # AI model to use
AGENT_MODE=autonomous             # Agent operation mode
MAX_ITERATIONS=10                 # Max improvement iterations
TEMPERATURE=0.7                   # AI creativity level
```

## Usage Example

```javascript
import { Orchestrator } from './src/agent/orchestrator/index.js';

const orchestrator = new Orchestrator({
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxIterations: 10,
});

const result = await orchestrator.execute({
  type: 'webapp',
  description: 'Create a todo list app',
  requirements: [
    'Add todos',
    'Mark as complete',
    'Delete todos',
  ],
});

console.log('Generated files:', result.files);
```

## Project Types Supported

| Type | Description | Example |
|------|-------------|---------|
| `webapp` | Web applications | React todo app |
| `api` | REST APIs | Express blog API |
| `cli` | Command-line tools | File converter |

## Key Features

- ✅ **Autonomous Code Generation** - From requirements to working code
- ✅ **Multi-Phase Workflow** - Plan, code, execute, review, iterate
- ✅ **Security Scanning** - Automatic vulnerability detection
- ✅ **Quality Checks** - Code smells, complexity, best practices
- ✅ **Sandbox Execution** - Safe code testing environment
- ✅ **Extensible Design** - Easy to add languages & frameworks

## Documentation Links

- 📖 [README](./README.md) - Project overview
- 🏗️ [ARCHITECTURE](./docs/ARCHITECTURE.md) - System design
- 🔌 [API Reference](./docs/API.md) - API documentation
- 🚀 [Getting Started](./docs/GETTING_STARTED.md) - Setup guide
- 🤝 [Contributing](./CONTRIBUTING.md) - Contribution guide
- 📊 [Project Summary](./PROJECT_SUMMARY.md) - Complete overview

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not found" | Add `OPENAI_API_KEY` to `.env` |
| "Module not found" | Run `npm install` |
| Tests failing | Check Node.js version (need 18+) |
| Code won't execute | Check sandbox settings in config |

## Next Steps

1. ✅ File structure created (DONE)
2. 🔄 Implement AI integration
3. 🔄 Build execution environment
4. 🔄 Add more language support
5. 🔄 Create web interface
6. 🔄 Build CLI tool

## Support

- 📝 [Open an Issue](https://github.com/paymetoworknow/Ai-Agent007/issues)
- 📧 Contact: See repository for details
- 📚 [Full Documentation](./docs/)

---

**Status**: ✅ Foundation Complete - Ready for Implementation

**Version**: 0.1.0

**License**: MIT
