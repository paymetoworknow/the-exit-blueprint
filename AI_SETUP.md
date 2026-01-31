# AI Setup Guide

This guide will help you configure AI capabilities in The Exit Blueprint application. You have two options for AI integration:

1. **OpenAI** (Recommended) - Cloud-based AI with best quality
2. **Ollama** (Alternative) - Self-hosted local AI for privacy and cost control

## Prerequisites

Before setting up AI, ensure you have:
- Node.js and npm installed
- The repository cloned locally
- A `.env.local` file in the root directory

## Option 1: OpenAI Setup (Recommended)

OpenAI provides the highest quality AI responses and is the easiest to set up.

### Step 1: Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (it starts with `sk-`)

### Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your OpenAI API key:
   ```bash
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   VITE_OPENAI_MODEL=gpt-4o-mini
   ```

3. Ensure `VITE_USE_OLLAMA` is set to `false` or commented out:
   ```bash
   VITE_USE_OLLAMA=false
   ```

### Step 3: Verify Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to Stage 1: Oracle
3. Try generating market analysis
4. You should see AI-generated content

### OpenAI Pricing

- **GPT-4o-mini**: ~$0.15 per million input tokens (~$0.60 per million output tokens)
- **GPT-4o**: ~$2.50 per million input tokens (~$10 per million output tokens)

For typical usage, expect $5-20/month depending on how frequently you use AI features.

## Option 2: Ollama Setup (Self-Hosted)

Ollama allows you to run AI models locally on your computer. This is free but requires:
- At least 8GB RAM (16GB+ recommended)
- 10GB+ free disk space per model
- Modern CPU (GPU optional but faster)

### Step 1: Install Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download the installer from [ollama.com/download](https://ollama.com/download)

### Step 2: Start Ollama Service

```bash
ollama serve
```

This starts the Ollama server on `http://localhost:11434`

### Step 3: Download a Model

In a new terminal, download a model (recommended: llama3.2):

```bash
# Faster, smaller model (8GB RAM minimum)
ollama pull llama3.2

# Or larger, more capable model (16GB RAM minimum)
ollama pull llama3:8b

# Or the largest model for best quality (32GB+ RAM)
ollama pull llama3:70b
```

### Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` to use Ollama:
   ```bash
   VITE_USE_OLLAMA=true
   VITE_OLLAMA_URL=http://localhost:11434
   VITE_OLLAMA_MODEL=llama3.2
   ```

3. Comment out or remove the OpenAI key:
   ```bash
   # VITE_OPENAI_API_KEY=
   ```

### Step 5: Verify Setup

1. Check Ollama is running:
   ```bash
   curl http://localhost:11434/api/version
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Navigate to Stage 1: Oracle
4. Try generating market analysis

**Note:** Local models may be slower than OpenAI and produce different quality results.

### Ollama Model Comparison

| Model | Size | RAM Required | Speed | Quality |
|-------|------|--------------|-------|---------|
| llama3.2 | 2GB | 8GB | Fast | Good |
| llama3:8b | 4.7GB | 16GB | Medium | Better |
| llama3:70b | 39GB | 64GB | Slow | Best |

## Troubleshooting

### "No AI provider configured"

This means neither OpenAI nor Ollama is properly configured.

**Solution:**
1. Check your `.env.local` file exists
2. Ensure either `VITE_OPENAI_API_KEY` is set or `VITE_USE_OLLAMA=true`
3. Restart your development server after changing `.env.local`

### "OpenAI API key is invalid"

**Solution:**
1. Verify your API key starts with `sk-`
2. Check the key hasn't expired in [OpenAI dashboard](https://platform.openai.com/api-keys)
3. Ensure there are no extra spaces in the key

### "Ollama unreachable"

**Solution:**
1. Check Ollama is running: `ollama serve`
2. Verify the URL is correct in `.env.local` (default: `http://localhost:11434`)
3. Test connection: `curl http://localhost:11434/api/version`
4. Check firewall isn't blocking port 11434

### "Ollama returned invalid JSON"

**Solution:**
1. Try a different model: `ollama pull llama3:8b`
2. Update `VITE_OLLAMA_MODEL` in `.env.local`
3. Some older models don't support JSON mode well

### CORS Errors with Ollama

**Solution:**
1. Ollama should allow all origins by default
2. If issues persist, restart Ollama: `killall ollama && ollama serve`

### Rate Limit Errors (OpenAI)

**Solution:**
1. You've exceeded your API quota
2. Check usage at [OpenAI usage dashboard](https://platform.openai.com/usage)
3. Add billing information or wait for quota reset
4. Consider switching to Ollama temporarily

## Switching Between Providers

You can easily switch between OpenAI and Ollama:

1. **To switch to OpenAI:**
   ```bash
   VITE_USE_OLLAMA=false
   VITE_OPENAI_API_KEY=sk-your-key
   ```

2. **To switch to Ollama:**
   ```bash
   VITE_USE_OLLAMA=true
   VITE_OLLAMA_URL=http://localhost:11434
   ```

3. Restart your development server

## Advanced Configuration

### Custom Ollama Host

If running Ollama on a different machine:

```bash
VITE_OLLAMA_URL=http://192.168.1.100:11434
```

### OpenAI Model Selection

For higher quality (but more expensive):

```bash
VITE_OPENAI_MODEL=gpt-4o
```

For faster/cheaper:

```bash
VITE_OPENAI_MODEL=gpt-4o-mini
```

## Best Practices

1. **Development**: Use Ollama to save costs
2. **Production**: Use OpenAI for best quality
3. **Keep API keys secret**: Never commit `.env.local` to git
4. **Monitor costs**: Check OpenAI usage dashboard regularly
5. **Model selection**: Start with smaller models and upgrade if needed

## Need Help?

- Check the [QUICK_FIX_GUIDE.md](./QUICK_FIX_GUIDE.md) for common errors
- OpenAI issues: [platform.openai.com/docs](https://platform.openai.com/docs)
- Ollama issues: [ollama.com/docs](https://ollama.com/docs)
- Create an issue on GitHub if you're still stuck
