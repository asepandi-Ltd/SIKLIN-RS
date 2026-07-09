<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/fd3d5f6a-16ba-40ab-8e3e-989e7f52c60b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

A `vercel.json` configuration file is already pre-configured for this project, optimized for standard Next.js deployments. Follow these simple steps to deploy:

### Step 1: Push to GitHub
1. Create a new repository on your GitHub account.
2. Initialize git in this directory (if not done yet):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Link and push to your GitHub repository:
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

### Step 2: Import Project to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your newly created GitHub repository.

### Step 3: Configure Environment Variables
Before clicking **Deploy**, make sure to add the following **Environment Variables** in the Vercel project settings:

| Key | Value Description | Example / Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public API key | Found in API settings of Supabase dashboard |
| `GEMINI_API_KEY` | Your Google Gemini API Key | Get one from Google AI Studio |
| `APP_URL` | The production URL of your deployed app | E.g. `https://your-app-name.vercel.app` (Can update this after Vercel assigns your domain) |

### Step 4: Deploy!
Click **Deploy**. Vercel will automatically build the Next.js application using the configurations in `vercel.json` and host it in the `sin1` (Singapore) region or your chosen preferred edge location.

