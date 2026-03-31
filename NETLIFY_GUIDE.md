# Netlify Deployment Guide

This guide will walk you through deploying your StudentFolio application to Netlify and configuring the necessary environment variables.

## 1. Prepare your Supabase Project

Before deploying, ensure your Supabase project is ready:
1. Log in to your [Supabase Dashboard](https://app.supabase.com/).
2. Go to your project settings -> **API**.
3. Locate your **Project URL** and **anon public** key. You will need these for Netlify.
4. Ensure you have created a storage bucket named \`portfolios\` and set it to **Public**.

## 2. Deploy to Netlify

1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Log in to [Netlify](https://app.netlify.com/).
3. Click **Add new site** -> **Import an existing project**.
4. Connect your Git provider and select your repository.
5. Netlify will automatically detect the build settings from the \`netlify.toml\` file included in this project:
   - **Build command:** \`npm run build\`
   - **Publish directory:** \`dist\`

## 3. Configure Environment Variables

Before clicking "Deploy site", you must add your Supabase environment variables:

1. In the Netlify deploy settings, click **Show advanced** -> **New variable**.
2. Add the following variables:
   - Key: \`VITE_SUPABASE_URL\`
     Value: *(Your Supabase Project URL)*
   - Key: \`VITE_SUPABASE_ANON_KEY\`
     Value: *(Your Supabase anon public key)*
3. Click **Deploy site**.

## 4. Post-Deployment

Once the deployment is complete, Netlify will provide you with a public URL for your site.

**Important:** You must add this new Netlify URL to your Supabase authentication settings:
1. Go to your Supabase Dashboard -> **Authentication** -> **URL Configuration**.
2. Add your Netlify URL to the **Site URL** and **Redirect URLs** list. This ensures that authentication redirects work correctly in production.
