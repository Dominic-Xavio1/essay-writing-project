# ASYV Writing

### A little village. A lot of stories. One wall to share them.

ASYV Writing is a community writing space for students at Agahozo-Shalom Youth Village. Publish an essay, discover a new perspective, and leave a little encouragement along the way.

🌐 **[Visit the site online](https://asyvwriters.vercel.app)**

## What you can do

- ✍️ Write and share essays, ideas, and stories
- 🔎 Explore by category, tag, or what readers are loving
- 💚 React, clap, comment, follow writers, and save reads for later
- 📚 Track reading activity and discover related stories
- 🛡️ Review submissions and manage the community
- 🌊 Settle into a calm, animated reading experience

## Built with

Next.js · React · PostgreSQL · Tailwind CSS · Framer Motion

## Run it locally

You'll need Node.js and a PostgreSQL database.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add a `.env.local` file in the project root:

   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
   SECRET_KEY=replace-with-a-long-random-secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   To enable Google sign-in, also add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Configure the Google OAuth callback as `http://localhost:3000/api/auth/google/callback`.

3. Apply the database schema:

   ```bash
   psql "postgresql://USER:PASSWORD@HOST:5432/DATABASE" -f db/schema.sql
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## A note from the wall

This project is built around a simple idea: every student has a story worth reading.
