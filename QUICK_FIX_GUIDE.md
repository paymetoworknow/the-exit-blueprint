# Quick Fix Guide - Common AI Errors

This guide lists common runtime errors when using AI features and how to fix them.

## Error: "No AI provider configured"

**Full message:** `No AI provider configured. Add VITE_OPENAI_API_KEY to .env.local or set VITE_USE_OLLAMA=true for local Ollama. See AI_SETUP.md for configuration steps.`

**What it means:** The app can't find any AI provider (neither OpenAI nor Ollama is configured).

**Quick fix:**
1. Create `.env.local` file in project root (if it doesn't exist)
2. Add one of these configurations:

   **For OpenAI:**
   ```bash
   VITE_OPENAI_API_KEY=sk-your-api-key-here
   VITE_USE_OLLAMA=false
   ```

   **For Ollama:**
   ```bash
   VITE_USE_OLLAMA=true
   VITE_OLLAMA_URL=http://localhost:11434
   ```

3. Restart your dev server: `npm run dev`

---

## Error: "OpenAI API key not configured"

**What it means:** You're trying to use OpenAI but the API key is missing.

**Quick fix:**
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env.local`:
   ```bash
   VITE_OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Restart dev server

---

## Error: "OpenAI API key is invalid"

**What it means:** The API key format is wrong or the key has been revoked.

**Quick fix:**
1. Verify key starts with `sk-`
2. Check for extra spaces or newlines
3. Generate a new key at [OpenAI Platform](https://platform.openai.com/api-keys)
4. Update `.env.local` with new key
5. Restart dev server

---

## Error: "Ollama unreachable at http://localhost:11434"

**What it means:** The app can't connect to Ollama server.

**Quick fix:**

**Check if Ollama is running:**
```bash
curl http://localhost:11434/api/version
```

**If not running, start it:**
```bash
ollama serve
```

**If Ollama isn't installed:**
- macOS: `brew install ollama`
- Linux: `curl -fsSL https://ollama.com/install.sh | sh`
- Windows: Download from [ollama.com](https://ollama.com)

**Still not working?**
1. Check firewall isn't blocking port 11434
2. Verify `VITE_OLLAMA_URL` in `.env.local` is correct
3. Try: `ollama list` to see available models

---

## Error: "Ollama returned invalid JSON"

**What it means:** The Ollama model produced text that isn't valid JSON when JSON was requested.

**Quick fix:**
1. Try a different model (some models handle JSON better):
   ```bash
   ollama pull llama3:8b
   ```
2. Update `.env.local`:
   ```bash
   VITE_OLLAMA_MODEL=llama3:8b
   ```
3. Restart dev server

**Alternative:** Switch to OpenAI temporarily for more reliable JSON responses.

---

## Error: "OpenAI rate limit exceeded"

**What it means:** You've made too many requests or exceeded your quota.

**Quick fix:**
1. Check usage at [OpenAI usage dashboard](https://platform.openai.com/usage)
2. Wait a few minutes and try again
3. Add billing info if using free tier
4. Temporarily switch to Ollama:
   ```bash
   VITE_USE_OLLAMA=true
   ```

---

## Error: "Network error connecting to OpenAI"

**What it means:** Your internet connection is down or OpenAI is blocked.

**Quick fix:**
1. Check internet connection
2. Try accessing [openai.com](https://openai.com) in browser
3. Check if VPN/firewall is blocking OpenAI
4. Try again in a few minutes (may be temporary outage)
5. Switch to Ollama as backup

---

## Error: "OpenAI service temporarily unavailable"

**What it means:** OpenAI's servers are having issues (HTTP 500/503).

**Quick fix:**
1. Check [OpenAI Status](https://status.openai.com/)
2. Wait a few minutes and retry
3. Switch to Ollama temporarily:
   ```bash
   VITE_USE_OLLAMA=true
   ```

---

## Error: "Image generation is not supported with Ollama"

**What it means:** You're trying to generate images but Ollama doesn't support image generation.

**Quick fix:**
1. Switch to OpenAI for features requiring images:
   ```bash
   VITE_USE_OLLAMA=false
   VITE_OPENAI_API_KEY=sk-your-key
   ```
2. Or skip image generation features when using Ollama

---

## Error: CORS error connecting to Ollama

**What it means:** Browser security is blocking the request to Ollama.

**Quick fix:**
1. Restart Ollama:
   ```bash
   killall ollama
   ollama serve
   ```
2. If persists, check Ollama is running on correct port
3. Ensure `VITE_OLLAMA_URL` uses `http://` not `https://`

---

## Error: "Ollama request timed out"

**What it means:** The model is taking too long to respond (over 60 seconds).

**Quick fix:**
1. Use a smaller/faster model:
   ```bash
   ollama pull llama3.2
   ```
2. Update `.env.local`:
   ```bash
   VITE_OLLAMA_MODEL=llama3.2
   ```
3. Ensure computer has enough RAM for the model
4. Close other heavy applications

---

## Environment Not Loading

**Symptom:** Changes to `.env.local` aren't taking effect.

**Quick fix:**
1. Restart dev server completely (Ctrl+C then `npm run dev`)
2. Verify file is named `.env.local` (not `.env` or `.env.local.txt`)
3. Check file is in project root directory
4. Ensure variables start with `VITE_` prefix

---

## General Troubleshooting Steps

If you're still having issues:

1. **Check the environment file:**
   ```bash
   cat .env.local
   ```
   Verify all required variables are present

2. **Verify AI provider:**
   - OpenAI: Check [platform.openai.com](https://platform.openai.com)
   - Ollama: Run `ollama list` to see models

3. **Check console:**
   - Open browser DevTools (F12)
   - Look at Console tab for detailed errors

4. **Test provider directly:**
   
   **OpenAI:**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $VITE_OPENAI_API_KEY"
   ```
   
   **Ollama:**
   ```bash
   curl http://localhost:11434/api/version
   ```

5. **Clear cache:**
   - Clear browser cache
   - Delete `node_modules` and run `npm install`
   - Restart dev server

6. **Check logs:**
   - Browser console (F12)
   - Terminal running dev server
   - Ollama logs (if using Ollama)

---

## Need More Help?

- See detailed setup: [AI_SETUP.md](./AI_SETUP.md)
- OpenAI docs: [platform.openai.com/docs](https://platform.openai.com/docs)
- Ollama docs: [ollama.com/docs](https://ollama.com/docs)
- Check existing issues on GitHub
- Create a new issue with:
  - Error message (full text)
  - Your environment (OS, browser, Node version)
  - Steps to reproduce
  - What you've already tried
