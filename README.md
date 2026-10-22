# Learn English — Daily Hinglish & Concept Clarity

A modern, 100% free-tier web application built to make English learning intuitive and natural for Hinglish speakers.

## Tech Stack (100% Free Tier)

| Layer | Technology | Platform |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 15 (React 19 + Tailwind CSS) | **Vercel** |
| **Backend API** | Node.js / TypeScript Server Actions & Routes | **Vercel Serverless** |
| **Database** | PostgreSQL + Realtime WebSockets | **Supabase** |
| **AI Tutor** | Google Gemini 1.5 Flash (`@google/generative-ai`) | **Vercel Edge / API** |

---

## Features

- **Daily English Classes & Foundational Topics**: Concept-first lessons breaking down common Hinglish translation mistakes into natural English.
- **Interactive Collapsible Tools Dock**:
  - **Desktop/Laptop**: Starts maximized by default, minimizes to a slim 56px dock, re-expands with `<` or tool icons.
  - **Mobile**: Floating movable action button (drag anywhere), 1-tap direct drawer access.
- **Akib Sir AI English Tutor**: Hinglish doubt-solving tutor powered by Gemini 1.5 Flash.
- **Realtime Classroom Chatroom**: Live WebSocket messaging per class powered by Supabase Realtime.
- **Class & Topic Notes**: Community study notes with instant submission and live updates.
- **Custom Admin Control Panel (`/admin`)**: ActiveAdmin-styled slate/navy dashboard for lesson CRUD and student management.

---

## Getting Started

### 1. Install Dependencies
```bash
cd web
npm install
```

### 2. Configure Environment Variables
Copy `web/.env.example` to `web/.env.local`:
```bash
cp web/.env.example web/.env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `GEMINI_API_KEY`

### 3. Run Development Server
```bash
cd web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or 3001) in your browser.
