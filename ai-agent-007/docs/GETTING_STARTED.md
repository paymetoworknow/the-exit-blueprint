# Getting Started with AI Agent 007

This guide will help you get started with AI Agent 007, an autonomous coding agent.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18 or higher installed
- An OpenAI API key (or access to another supported AI provider)
- Basic knowledge of command line operations

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/paymetoworknow/Ai-Agent007.git
cd ai-agent-007
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

## Basic Usage

### Running the Agent

Start the agent with:

```bash
npm start
```

This will run the default example (creating a todo list app).

### Creating Custom Projects

Edit `src/index.js` to customize the project:

```javascript
const result = await orchestrator.execute({
  type: 'webapp',  // or 'api', 'cli'
  description: 'Your project description',
  requirements: [
    'Requirement 1',
    'Requirement 2',
    'Requirement 3',
  ],
});
```

## Project Types

### Web Application (`webapp`)

Creates a modern web application with React:

```javascript
{
  type: 'webapp',
  description: 'E-commerce product catalog',
  requirements: [
    'Display products in a grid',
    'Filter by category',
    'Search functionality',
    'Product detail view',
  ],
}
```

### API Server (`api`)

Creates a RESTful API server:

```javascript
{
  type: 'api',
  description: 'User management API',
  requirements: [
    'User registration',
    'User authentication',
    'Profile management',
    'Password reset',
  ],
}
```

### CLI Tool (`cli`)

Creates a command-line tool:

```javascript
{
  type: 'cli',
  description: 'File converter tool',
  requirements: [
    'Convert JSON to CSV',
    'Convert CSV to JSON',
    'Support batch processing',
    'Progress indicators',
  ],
}
```

## Understanding the Output

The agent will:

1. **Plan** - Analyze requirements and create an implementation plan
2. **Code** - Generate all necessary files
3. **Execute** - Test the generated code
4. **Review** - Check quality and provide feedback
5. **Iterate** - Improve based on feedback (if needed)

Generated files will be in the output directory (configurable in `config/agent.config.json`).

## Configuration Options

### Model Selection

Change the AI model in `.env`:

```bash
OPENAI_MODEL=gpt-4-turbo-preview  # More capable, slower
# or
OPENAI_MODEL=gpt-3.5-turbo        # Faster, less expensive
```

### Agent Behavior

Edit `config/agent.config.json` to customize:

```json
{
  "execution": {
    "maxIterations": 10,      // Max improvement iterations
    "sandboxMode": true,       // Run code in sandbox
    "timeoutSeconds": 300      // Execution timeout
  },
  "review": {
    "minimumScore": 70         // Quality threshold
  }
}
```

## Examples

### Example 1: Todo List App

```javascript
await orchestrator.execute({
  type: 'webapp',
  description: 'Simple todo list application',
  requirements: [
    'Add new todos',
    'Mark todos as complete',
    'Delete todos',
    'Filter by status (all/active/completed)',
    'Persist data in localStorage',
  ],
});
```

### Example 2: Weather API

```javascript
await orchestrator.execute({
  type: 'api',
  description: 'Weather data API',
  requirements: [
    'Get current weather by city',
    'Get 5-day forecast',
    'Support multiple units (metric/imperial)',
    'Rate limiting',
    'Error handling',
  ],
});
```

### Example 3: File Analyzer CLI

```javascript
await orchestrator.execute({
  type: 'cli',
  description: 'File analysis tool',
  requirements: [
    'Analyze file size',
    'Count lines of code',
    'Detect file type',
    'Support multiple files',
    'Output as table or JSON',
  ],
});
```

## Troubleshooting

### "API key not found" Error

**Solution**: Ensure your `.env` file has a valid `OPENAI_API_KEY`

### "Module not found" Error

**Solution**: Run `npm install` to install dependencies

### Code Execution Fails

**Solution**: Check the execution logs in `logs/agent.log` for details

### Low Quality Score

**Solution**: Increase `maxIterations` in config to allow more improvement cycles

## Next Steps

- Read the [Architecture Documentation](./ARCHITECTURE.md) to understand how the agent works
- Check the [API Documentation](./API.md) for detailed API reference
- Explore example projects in the `examples/` directory
- Customize prompts in `src/prompts/` for your specific needs

## Getting Help

- Check the [documentation](./docs/)
- Open an issue on GitHub
- Review example projects

## Tips for Best Results

1. **Be specific** in requirements - clear requirements lead to better code
2. **Start simple** - test with basic projects first
3. **Iterate** - let the agent improve the code through multiple iterations
4. **Review output** - always review and test generated code before using in production
5. **Customize prompts** - adjust system prompts for your coding style preferences

Happy coding with AI Agent 007! 🤖
