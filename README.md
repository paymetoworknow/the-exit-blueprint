# The Exit Blueprint

A comprehensive business planning and exit strategy platform that helps entrepreneurs validate ideas, build brands, and prepare for successful exits using AI-powered insights.

## Features

- 🎯 **Stage 1 - The Oracle**: Validate your business idea with AI-powered market analysis
- 🏗️ **Stage 2 - The Architect**: Build your brand identity with AI-generated assets
- ⚙️ **Stage 3 - The Engine**: Track operations and manage your business workflows
- 📊 **Stage 4 - The Quant**: Financial modeling and scenario planning
- 🚀 **Stage 5 - The Exit**: Prepare pitch decks and connect with investors

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase project (for database)
- Either OpenAI API key OR Ollama installed (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/paymetoworknow/the-exit-blueprint.git
   cd the-exit-blueprint
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` and configure:
   - **Supabase credentials** (required)
   - **AI provider** (choose ONE):
     - OpenAI (paid, high quality) - Add `VITE_OPENAI_API_KEY`
     - Ollama (FREE, self-hosted) - Set `VITE_USE_OLLAMA=true`
   
   📖 **See [AI_SETUP.md](./AI_SETUP.md) for detailed AI configuration instructions**

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## AI Setup (Important!)

⚠️ **AI features and buttons won't work until you configure an AI provider.**

Choose ONE of these options:

### Option A: OpenAI (Recommended for Production)
- Sign up at [OpenAI Platform](https://platform.openai.com/)
- Get an API key
- Add to `.env.local`: `VITE_OPENAI_API_KEY=sk-your-key`
- Cost: ~$0.01-0.05 per request

### Option B: Ollama (FREE Self-Hosted)
- Install from [ollama.ai](https://ollama.ai)
- Run: `ollama pull llama3.2`
- Add to `.env.local`: `VITE_USE_OLLAMA=true`
- Cost: FREE (runs on your computer)

📖 **For complete setup instructions, see [AI_SETUP.md](./AI_SETUP.md)**

## Supabase Setup

The application requires a Supabase backend for data storage and authentication.

📖 **See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete database setup instructions**

Quick setup:
1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migrations from `SUPABASE_SETUP.md`
3. Add your project URL and anon key to `.env.local`

## Project Structure

```
the-exit-blueprint/
├── src/
│   ├── api/              # API integrations (Supabase, AI)
│   ├── components/       # Reusable React components
│   │   └── ui/          # shadcn/ui components
│   ├── pages/           # Application pages/routes
│   ├── lib/             # Utility functions
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Helper functions
├── public/              # Static assets
└── functions/           # Serverless functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Tech Stack

- **Frontend**: React 18, Vite 6
- **UI**: Radix UI, shadcn/ui, Tailwind CSS
- **State**: TanStack Query (React Query)
- **Database**: Supabase
- **AI**: OpenAI or Ollama
- **Analytics**: Vercel Analytics

## Troubleshooting

### "No AI provider configured" Error

**Solution**: Configure either OpenAI or Ollama in `.env.local`
- See [AI_SETUP.md](./AI_SETUP.md) for detailed instructions

### Buttons Not Working

1. Check browser console (F12) for errors
2. Verify `.env.local` is configured correctly
3. Ensure all environment variables start with `VITE_`
4. Restart the dev server

### "Cannot connect to Supabase" Error

1. Verify Supabase URL and anon key in `.env.local`
2. Check your Supabase project is active
3. Ensure you've run the database migrations

### Build Fails

1. Clear node_modules: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Try building again: `npm run build`

## Documentation

- [AI Setup Guide](./AI_SETUP.md) - Configure OpenAI or Ollama
- [Supabase Setup](./SUPABASE_SETUP.md) - Database setup and migrations
- [AI Integration TODO](./AI_INTEGRATION_TODO.md) - Legacy AI migration notes
- [Migration Summary](./MIGRATION_SUMMARY.md) - Base44 to Supabase migration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Environment Variables

### Required

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### AI Provider (Choose ONE)

```env
# Option 1: OpenAI
VITE_OPENAI_API_KEY=sk-your-key
VITE_OPENAI_MODEL=gpt-4o-mini

# Option 2: Ollama (FREE)
VITE_USE_OLLAMA=true
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.2
```

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database powered by [Supabase](https://supabase.com/)
- AI powered by [OpenAI](https://openai.com/) or [Ollama](https://ollama.ai/)
