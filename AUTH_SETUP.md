# Authentication Setup Guide

This guide walks you through setting up Google OAuth authentication for SplitWiser.

## Prerequisites

- A Google Cloud account (free)
- Access to your Supabase project dashboard

## Step 1: Google Cloud Console Setup (~10 minutes)

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it "SplitWiser" (or any name you prefer)
4. Click **Create**

### 1.2 Enable Required APIs

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API" and click on it
3. Click **Enable**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type → **Create**
3. Fill in the required fields:
   - **App name**: SplitWiser
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. On Scopes page, click **Save and Continue** (default scopes are fine)
6. On Test users page, add your email address
7. Click **Save and Continue** → **Back to Dashboard**

### 1.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application** as the application type
4. Name it "SplitWiser Web Client"
5. Add **Authorized JavaScript origins**:
   - `http://localhost:3333` (for local development)
   - Your production URL (e.g., `https://splitwiser.vercel.app`)
6. Add **Authorized redirect URIs**:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   
   > Find your project ref in Supabase Dashboard → Settings → General → Reference ID
   
7. Click **Create**
8. **Copy the Client ID and Client Secret** - you'll need these next

## Step 2: Supabase Dashboard Setup (~5 minutes)

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and click to expand
5. Toggle **Enable Sign in with Google**
6. Paste your **Client ID** and **Client Secret** from Google Cloud
7. Click **Save**

### 2.2 Configure URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**:
   - For development: `http://localhost:3333`
   - For production: Your production URL
3. Add **Redirect URLs**:
   - `http://localhost:3333/**` (for local dev)
   - `https://your-production-url.com/**` (for production)
4. Click **Save**

## Step 3: Run Database Migration

After setting up authentication, run the database migration to:
- Clear existing mock data
- Add the `role` column for admin functionality
- Update Row Level Security policies

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/002_add_auth.sql
```

## Step 4: Set Yourself as Admin

After you sign in for the first time, run this SQL to make yourself an admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@gmail.com';
```

## Troubleshooting

### "redirect_uri_mismatch" Error

Make sure the redirect URI in Google Cloud Console exactly matches:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

### "Access blocked" Error

Your OAuth consent screen is in "Testing" mode. Either:
1. Add your email to test users, OR
2. Publish the app (requires verification for >100 users)

### User Not Created After Login

Check browser console for errors. Common issues:
- RLS policies blocking insert
- Missing required fields in users table

## Security Notes

- Never commit your Client Secret to version control
- The Client ID is safe to expose (it's in the browser anyway)
- Supabase handles token storage securely
- RLS policies ensure users can only access their own data

