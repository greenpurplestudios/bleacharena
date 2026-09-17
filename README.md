# Bleach Arena

Bleach Arena is a premium web application where you can draft your Bleach dream team, guess quotes, and climb the weekly leaderboard. It supports both English and Arabic with full RTL/LTR capabilities.

## Features

- **Draft Mode:** Create your ultimate Bleach team.
- **Quote Guessing:** Test your knowledge of Bleach quotes.
- **Weekly Leaderboard:** Compete against other players.
- **Bilingual:** Full English and Arabic support (RTL/LTR).
- **PWA:** Installable as a Progressive Web App.
- **Authentication:** Sign in with Google or play as a guest.

## Technology Stack

- **Frontend:** React, TanStack Start, Tailwind CSS, TypeScript
- **Backend & Database:** Supabase (Auth, Database, Storage)
- **Deployment:** Nitro

## Local Development

1. **Clone the repository:**
   `git clone <repository-url>`
   `cd bleach-arena`

2. **Install dependencies:**
   `npm install`

3. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   `cp .env.example .env`

4. **Run the development server:**
   `npm run dev`

## Environment Variables

The application requires the following environment variables. See `.env.example` for details.

- `VITE_SUPABASE_URL`: Client-side Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Client-side Supabase anonymous key.
- `SUPABASE_URL`: Server-side Supabase project URL.
- `SUPABASE_PUBLISHABLE_KEY`: Server-side Supabase anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side Supabase service role key (keep this secret!).

## Build and Deploy

To build the application for production:

`npm run build`

This will create a production-ready build in the `.output` or `dist` directory (depending on Nitro configuration) that can be deployed to your preferred hosting provider.
