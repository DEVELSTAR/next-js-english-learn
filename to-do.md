# Learn English - Migration to Vercel + Supabase (100% Free Stack)

This app has been migrated from Render to a modern, zero-maintenance free tier stack:

| App Component | Tech Choice | Free Platform | Status |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Next.js 15 (React 19 + Tailwind CSS) | **Vercel** | ✅ Ready in `/web` |
| **Backend API** | Node.js / TypeScript Server Actions & Routes | **Vercel Serverless** | ✅ Ready in `/web` |
| **Database** | PostgreSQL + Auth + Realtime + Storage | **Supabase Database** | ✅ Keys Configured in `web/.env.local` |
| **AI Tutor** | Google Gemini 1.5 Flash (`@google/generative-ai`) | **Vercel Edge / API** | ✅ Key Configured in `web/.env.local` |

---

## Final Step: Initialize Database Tables in Supabase

1. Open your SQL Editor:
   👉 **[https://supabase.com/dashboard/project/oaeyxtkobqevhwrdylgf/sql/new](https://supabase.com/dashboard/project/oaeyxtkobqevhwrdylgf/sql/new)**
2. Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql), paste it in the editor, and click **Run**.
3. Copy the contents of [`supabase/seed.sql`](supabase/seed.sql), paste it in the editor, and click **Run** to insert starter lessons.

---

## Running and Deploying

- **Local Dev**:
  ```bash
  cd web && npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000) (or 3001).

- **Deploy to Vercel (1-Click Free Hosting)**:
  1. Commit and push this repo to GitHub.
  2. In [vercel.com](https://vercel.com), click **Add New Project** and select this repo.
  3. Add the environment variables from `web/.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`).
  4. Click **Deploy**!
