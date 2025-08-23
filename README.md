# Prompt Battle Arena (PBA)

Let AI Models Battle for Glory - The ultimate platform for comparing AI model performance through structured battles.

## Features

- **Two Battle Types**: Prompt refinement battles and response generation battles
- **Auto & Manual Modes**: AI-powered model selection or manual control
- **Live API Integration**: Real battles using Groq Cloud LLMs
- **Comprehensive Scoring**: AI-powered judging with detailed feedback
- **User Management**: Full authentication with Supabase
- **Rich Analytics**: Battle history, statistics, and insights

## Quick Start

### Prerequisites

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Groq API Key**: Get your key from [console.groq.com](https://console.groq.com)

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key_here
   ```

### Database Setup

The Supabase migrations will automatically create all necessary tables and policies when you connect your Supabase project.

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Deployment

#### Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

#### Netlify
1. Connect repository to Netlify
2. Update `netlify.toml` with your Groq API key
3. Deploy

#### Cloudflare Pages
1. Connect repository to Cloudflare Pages
2. Add environment variables in dashboard
3. Deploy

## Demo Accounts

- **Demo User**: demo@example.com / demo123
- **Admin User**: admin@pba.com / admin123

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI API**: Groq Cloud LLMs

## Security

- Row Level Security (RLS) enabled on all tables
- API keys stored securely server-side
- User data isolation and protection
- Admin role-based access control

## Support

For issues or questions, use the in-app feedback widget or contact support.