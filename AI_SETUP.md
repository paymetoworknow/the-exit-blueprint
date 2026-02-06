# AI Setup Guide for Exit Blueprint

This guide will help you configure AI functionality for The Exit Blueprint application.

## Problem: AI and Buttons Not Working

If the AI features (generate buttons) and save buttons are not working, it's likely because:

1. **Missing Environment Configuration** - The `.env.local` file is not set up
2. **No AI Provider Configured** - Neither OpenAI nor Ollama is configured

## Quick Fix

### Step 1: Create Environment File

```bash
cp .env.local.example .env.local
```

### Step 2: Choose Your AI Provider

You have TWO options for AI:

#### Option A: OpenAI (Recommended for Production)

**Pros:**
- High quality responses
- Reliable and fast
- No local setup required

**Cons:**
- Requires API key (paid service)
- ~$0.15 per 1M input tokens for gpt-4o-mini

**Setup:**

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Edit `.env.local` and add your key:

```env
VITE_OPENAI_API_KEY=sk-your-actual-key-here
VITE_OPENAI_MODEL=gpt-4o-mini
```

#### Option B: Ollama (FREE Self-Hosted)

**Pros:**
- Completely FREE
- No API keys needed
- Privacy - runs locally
- No rate limits

**Cons:**
- Requires local installation
- Uses computer resources
- Slightly slower responses

**Setup:**

1. **Install Ollama**

   Visit [ollama.ai](https://ollama.ai) and download for your OS:
   
   - **macOS/Linux:**
     ```bash
     curl -fsSL https://ollama.ai/install.sh | sh
     ```
   
   - **Windows:** 
     Download from [ollama.ai/download](https://ollama.ai/download)

2. **Download AI Model**

   ```bash
   ollama pull llama3.2
   ```
   
   This downloads the Llama 3.2 model (~2GB). Other good options:
   - `ollama pull llama3.2:3b` (smaller, faster)
   - `ollama pull mistral` (alternative)
   - `ollama pull phi3` (very small, good for testing)

3. **Start Ollama Service**

   Ollama usually runs automatically after installation. To verify:
   
   ```bash
   ollama list
   ```
   
   You should see your downloaded models.

4. **Configure Exit Blueprint**

   Edit `.env.local`:

   ```env
   VITE_USE_OLLAMA=true
   VITE_OLLAMA_URL=http://localhost:11434
   VITE_OLLAMA_MODEL=llama3.2
   ```

### Step 3: Add Supabase Configuration

You also need Supabase credentials for the app to work:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anonymous-key
```

Get these from your [Supabase project settings](https://app.supabase.com).

### Step 4: Restart Development Server

```bash
npm run dev
```

## Testing Your Setup

After configuration, test these features:

1. **Stage 1 (Oracle)**
   - Fill in business details
   - Click "Save Progress" - should save without errors
   - Click "Generate Analysis" - should create market analysis

2. **Stage 2 (Architect)**
   - Click "Generate Brand Assets" - should create branding
   
3. **Business Plan Generator**
   - Click "Generate Business Plan" - should create comprehensive plan

## Troubleshooting

### "No AI provider configured" Error

**Solution:** Make sure you've configured either OpenAI OR Ollama in `.env.local`

### "Cannot connect to Ollama" Error

**Solutions:**
1. Verify Ollama is running: `ollama list`
2. Try starting it: `ollama serve`
3. Check if port 11434 is in use
4. Make sure you pulled a model: `ollama pull llama3.2`

### "OpenAI API key is invalid" Error

**Solutions:**
1. Double-check your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Ensure key starts with `sk-`
3. Check you have credits on your OpenAI account
4. Verify the key has proper permissions

### Buttons Still Not Working

1. **Check Browser Console** - Press F12 and look for errors
2. **Clear Browser Cache** - Hard refresh with Ctrl+Shift+R (Cmd+Shift+R on Mac)
3. **Verify .env.local** - Ensure all variables start with `VITE_`
4. **Restart Dev Server** - Stop and run `npm run dev` again

## Switching Between Providers

You can easily switch between OpenAI and Ollama:

**To use OpenAI:**
```env
# VITE_USE_OLLAMA=true  # Comment this out
VITE_OPENAI_API_KEY=sk-your-key
```

**To use Ollama:**
```env
VITE_USE_OLLAMA=true
# VITE_OPENAI_API_KEY=...  # Can leave this, it won't be used
```

## Cost Considerations

### OpenAI (gpt-4o-mini)
- Input: ~$0.15 per 1M tokens (~750k words)
- Output: ~$0.60 per 1M tokens
- Average request: ~$0.01-0.05
- Monthly (moderate use): ~$10-50

### Ollama
- Completely FREE
- One-time download: ~2GB disk space
- RAM usage: 4-8GB while running
- No ongoing costs

## Recommended Setup

**For Development/Testing:**
- Use Ollama (free, no API limits)

**For Production/Demo:**
- Use OpenAI (better quality, more reliable)

**For Privacy-Conscious:**
- Use Ollama (all data stays local)

## Getting Help

If you're still having issues:

1. Check the browser console (F12) for errors
2. Check the terminal where `npm run dev` is running
3. Verify all environment variables are set correctly
4. Ensure Supabase is configured (required for saving data)

## Example Complete .env.local

```env
# Supabase (Required)
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Option 1: OpenAI
VITE_OPENAI_API_KEY=sk-proj-abc123...
VITE_OPENAI_MODEL=gpt-4o-mini

# Option 2: Ollama (comment out OpenAI if using this)
# VITE_USE_OLLAMA=true
# VITE_OLLAMA_URL=http://localhost:11434
# VITE_OLLAMA_MODEL=llama3.2
```

Choose ONE AI option and you're ready to go!
