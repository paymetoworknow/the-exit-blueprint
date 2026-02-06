# API Documentation

## Core Classes

### Orchestrator

The main coordinator that manages the entire agent workflow.

```javascript
import { Orchestrator } from './agent/orchestrator/index.js';

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
```

#### Methods

**`execute(request)`**
- Executes the full agent workflow
- Parameters:
  - `request.type` (string): Project type ('webapp', 'api', 'cli')
  - `request.description` (string): Project description
  - `request.requirements` (array): List of requirements
- Returns: Object with generated files and metadata

**`iterate(request, plan, code, review)`**
- Iterates on code based on feedback
- Used internally for improvement loops

---

### Planner

Analyzes requirements and creates implementation plans.

```javascript
import { Planner } from './agent/planner/index.js';

const planner = new Planner();
const plan = await planner.createPlan({
  type: 'webapp',
  description: 'Todo list application',
  requirements: ['Add', 'Edit', 'Delete tasks'],
});
```

#### Methods

**`createPlan(request)`**
- Creates an implementation plan from requirements
- Returns: Structured plan with architecture, files, dependencies

**`refinePlan(plan, feedback)`**
- Refines a plan based on feedback
- Returns: Updated plan

---

### Coder

Generates code based on implementation plans.

```javascript
import { Coder } from './agent/coder/index.js';

const coder = new Coder();
const code = await coder.generateCode(plan);
```

#### Methods

**`generateCode(plan)`**
- Generates all code files from plan
- Returns: Object with files and metadata

**`generateFile(fileSpec, plan)`**
- Generates a single file
- Returns: File object with path, content, language

**`fixCode(code, errors)`**
- Fixes code based on error feedback
- Returns: Updated code

---

### Executor

Executes and tests generated code.

```javascript
import { Executor } from './agent/executor/index.js';

const executor = new Executor({ sandboxMode: true });
const result = await executor.run(code);
```

#### Methods

**`run(code)`**
- Executes the generated code safely
- Returns: Execution results with output and errors

**`runTests(code)`**
- Runs tests on the code
- Returns: Test results with pass/fail counts

**`validateBuild(code)`**
- Validates code can be built/compiled
- Returns: Build validation result

---

### Reviewer

Reviews code quality, security, and best practices.

```javascript
import { Reviewer } from './agent/reviewer/index.js';

const reviewer = new Reviewer();
const review = await reviewer.review(code, executionResult);
```

#### Methods

**`review(code, executionResult)`**
- Reviews code and provides feedback
- Returns: Review object with issues, score, suggestions

**`checkSecurity(code)`**
- Checks for security vulnerabilities
- Returns: Array of security issues

**`checkQuality(code)`**
- Checks code quality
- Returns: Array of quality issues

**`checkPerformance(code)`**
- Checks performance issues
- Returns: Array of performance issues

---

## Utility Functions

### Logger

```javascript
import { setupLogger, getLogger } from './utils/logger.js';

// Setup logger
const logger = setupLogger('info');

// Use logger
logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message');
logger.success('Success message');
```

### AI Client

```javascript
import { getAIClient } from './utils/ai-client.js';

const ai = getAIClient();

// Generate code
const code = await ai.generateCode({
  type: 'react-component',
  name: 'Button',
});

// Review code
const review = await ai.reviewCode(codeString);
```

### File System

```javascript
import * as fs from './utils/file-system.js';

// Write file
await fs.writeFile('path/to/file.js', content);

// Read file
const content = await fs.readFile('path/to/file.js');

// Check if file exists
const exists = await fs.fileExists('path/to/file.js');

// List directory
const files = await fs.listDir('path/to/dir');
```

---

## Tools

### CodeAnalyzer

```javascript
import { CodeAnalyzer } from './tools/code-analyzer.js';

// Check syntax
const syntaxResult = await CodeAnalyzer.checkSyntax(code, 'javascript');

// Detect vulnerabilities
const vulnerabilities = await CodeAnalyzer.detectVulnerabilities(code);

// Analyze complexity
const complexity = CodeAnalyzer.analyzeComplexity(code);

// Detect code smells
const smells = CodeAnalyzer.detectCodeSmells(code);
```

### ProjectGenerator

```javascript
import { ProjectGenerator } from './tools/project-generator.js';

const generator = new ProjectGenerator();

// Generate project
const result = await generator.generateProject({
  type: 'webapp',
  name: 'my-app',
  outputDir: './output',
});
```

---

## Configuration

Configuration is loaded from `config/agent.config.json` and environment variables.

### Environment Variables

```bash
# AI Provider
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4-turbo-preview

# Agent
AGENT_MODE=autonomous
MAX_ITERATIONS=10
TEMPERATURE=0.7

# Execution
ENABLE_EXECUTION=true
SANDBOX_MODE=true
TIMEOUT_SECONDS=300

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/agent.log
```

### Config File

See `config/agent.config.json` for full configuration options.

---

## Error Handling

All methods may throw errors. Use try-catch blocks:

```javascript
try {
  const result = await orchestrator.execute(request);
  console.log('Success:', result);
} catch (error) {
  console.error('Failed:', error.message);
}
```

Common error types:
- `AIError`: AI provider errors
- `ExecutionError`: Code execution failures
- `ValidationError`: Invalid input or configuration
- `TimeoutError`: Operations that exceed time limits
