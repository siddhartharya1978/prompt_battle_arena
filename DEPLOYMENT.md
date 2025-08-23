# Deployment Guide - Prompt Battle Arena

## Required Environment Variables

### Backend/Server Environment Variables (REQUIRED):
```
GROQ_API_KEY=your_groq_api_key_here
```

### Frontend Environment Variables:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=your_deployed_app_url
```

## Deployment Instructions

### 1. Vercel Deployment

1. Connect your GitHub repository to Vercel
2. In Vercel dashboard, go to Settings → Environment Variables
3. Add the following variables:
   - `GROQ_API_KEY` = your_groq_api_key_here
   - `VITE_SUPABASE_URL` = your_supabase_project_url
   - `VITE_SUPABASE_ANON_KEY` = your_supabase_anon_key
   - `VITE_APP_URL` = your_vercel_app_url
4. Deploy automatically on push

### 2. Netlify Deployment

1. Connect repository to Netlify
2. Update `netlify.toml` line 15: Replace `YOUR_GROQ_API_KEY_HERE` with your actual key
3. In Netlify dashboard, add environment variables:
   - `VITE_SUPABASE_URL` = your_supabase_project_url
   - `VITE_SUPABASE_ANON_KEY` = your_supabase_anon_key
   - `VITE_APP_URL` = your_netlify_app_url
4. Deploy

### 3. Cloudflare Pages

1. Connect repository to Cloudflare Pages
2. In Pages dashboard, add environment variables:
   - `GROQ_API_KEY` = your_groq_api_key_here
   - `VITE_SUPABASE_URL` = your_supabase_project_url
   - `VITE_SUPABASE_ANON_KEY` = your_supabase_anon_key
   - `VITE_APP_URL` = your_cloudflare_pages_url
3. Deploy

## File Locations for Manual Setup

- **Local development**: Add your Groq API key to `.env` file (line 5)
- **Vercel**: Environment Variables in dashboard
- **Netlify**: Update `netlify.toml` line 15 + dashboard env vars
- **Cloudflare**: Environment Variables in Pages dashboard

## Security Notes

- Groq API key is NEVER exposed to frontend
- All API calls go through Supabase Edge Functions
- Keys are stored server-side only
- No user input required for API configuration