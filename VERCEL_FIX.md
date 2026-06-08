# 🔧 Fix Vercel 500 Error - Complete Guide

## Problem
Your Vercel deployment shows **500 errors** because environment variables are missing.

The app needs `DATABASE_URL` and other environment variables to connect to Supabase PostgreSQL, but they're not configured in Vercel.

---

## ✅ SOLUTION: 3 Methods (Choose One)

### **Method 1: Automated Setup with CLI (RECOMMENDED - 2 minutes)**

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Run the automated setup script**:
```bash
node setup-vercel.js
```

4. **Redeploy**:
```bash
vercel --prod
```

✅ Done! Your site should work now.

---

### **Method 2: Manual Setup via Vercel Dashboard (5 minutes)**

1. Go to: https://vercel.com/mrv0for0vandeta/patrimoine-jet/settings/environment-variables

2. Click **"Add Environment Variable"** and add these 7 variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres.elswjgrymyiklvsjimav:Medmahdi2025+@aws-0-us-east-1.pooler.supabase.com:6543/postgres` | Production |
| `NODE_ENV` | `production` | Production |
| `JWT_SECRET` | `moroccan_heritage_jwt_secret_2024_secure_minimum_32_chars` | Production |
| `SESSION_SECRET` | `moroccan_session_secret_2024_secure_minimum_32_chars` | Production |
| `ADMIN_USERNAME` | `admin` | Production |
| `ADMIN_PASSWORD` | `Patrimoine2024!` | Production |
| `ADMIN_EMAIL` | `admin@patrimoine.gov.ma` | Production |

3. After adding all variables, go to: https://vercel.com/mrv0for0vandeta/patrimoine-jet/deployments

4. Click on the latest deployment → Click **"Redeploy"** button

✅ Done! Your site should work now.

---

### **Method 3: Deploy to Railway Instead (1 minute - Zero Configuration)**

Railway automatically reads `.env.production` file, so you don't need to manually configure anything.

1. Go to: https://railway.app/new

2. Click **"Deploy from GitHub repo"**

3. Select your repository: `mrv0for0vandeta/patrimoine`

4. Railway will automatically:
   - Read your `.env.production` file
   - Set up the environment variables
   - Deploy your app
   - Give you a public URL

✅ Done! Your site will work immediately.

**Railway Benefits:**
- ✅ No manual environment variable setup needed
- ✅ Automatic deployments on git push
- ✅ Better PostgreSQL integration
- ✅ Free tier includes 500 hours/month
- ✅ Built-in database hosting option

---

## Why This Happened

1. **`.env.production` files don't work on Vercel** - they're only for local development
2. Vercel requires environment variables to be set in the dashboard or via CLI
3. Without `DATABASE_URL`, your app can't connect to the database
4. This causes the app to crash with 500 errors

---

## Verify It's Working

After fixing and redeploying:

1. Visit: https://patrimoine-jet.vercel.app/
2. You should see the survey platform homepage (no 500 error)
3. Visit: https://patrimoine-jet.vercel.app/health
4. You should see: `{"success": true, "status": "healthy"}`

---

## Still Not Working?

Check the logs:
```bash
vercel logs patrimoine-jet --prod
```

Or visit: https://vercel.com/mrv0for0vandeta/patrimoine-jet/logs

Look for:
- ✅ "Database initialized" = Good!
- ❌ "DATABASE_URL environment variable is required" = Env vars not set
- ❌ "Connection failed" = Wrong database credentials

---

## Recommendation

**Use Railway** (Method 3) - It's specifically designed for full-stack apps with databases and requires zero manual configuration. Vercel is great for static sites, but for apps with databases, Railway is better.
