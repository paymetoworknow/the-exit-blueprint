**Welcome to The Exit Blueprint** 

**About**

This is a React-based SaaS application that helps entrepreneurs plan and execute business exits using Supabase as the backend.

This project contains everything you need to run your app locally with self-hosted capabilities.

**Edit the code in your local development environment**

Any change pushed to the repo will be reflected immediately.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

e.g.
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Run the app: `npm run dev`

**Tech Stack**

- Frontend: React 18 with Vite
- Backend: Supabase (PostgreSQL database, authentication, and storage)
- UI: Tailwind CSS with shadcn/ui components
- State Management: TanStack Query (React Query)

**Docs & Support**

Documentation: See [Supabase Documentation](https://supabase.com/docs)
