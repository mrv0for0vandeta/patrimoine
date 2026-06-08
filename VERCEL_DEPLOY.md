# 🚀 Deploy to Vercel - Simple Guide

## ✅ Your app is now Vercel-ready!

---

## 📋 Step 1: Get Your Supabase Password

1. Go to: https://supabase.com/dashboard/project/elswjgrymyiklvsjimav/settings/database
2. Find your database password (you set this when creating the project)
3. Copy it

---

## 📋 Step 2: Deploy to Vercel

### Option A: Deploy from GitHub (Recommended)

1. **Go to**: https://vercel.com/new
2. **Import** your repository: `mrv0for0vandeta/patrimoine`
3. **Add Environment Variables**:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.elswjgrymyiklvsjimav.supabase.co:5432/postgres

NODE_ENV=production

JWT_SECRET=moroccan_heritage_jwt_secret_2024_secure

SESSION_SECRET=moroccan_session_secret_2024_secure

ADMIN_USERNAME=admin

ADMIN_PASSWORD=Patrimoine2024!

ADMIN_EMAIL=admin@patrimoine.gov.ma
```

4. **Click Deploy**
5. **Wait 2 minutes**
6. **Done!** 🎉

---

### Option B: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NODE_ENV
vercel env add JWT_SECRET
vercel env add SESSION_SECRET
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
vercel env add ADMIN_EMAIL

# Deploy to production
vercel --prod
```

---

## 🎯 After Deployment

Your app will be live at: `https://patrimoine-xxxx.vercel.app`

### Test these URLs:
- **Homepage**: `https://your-url.vercel.app/`
- **Admin**: `https://your-url.vercel.app/admin`
- **Health**: `https://your-url.vercel.app/health`
- **API**: `https://your-url.vercel.app/api`

### Login:
- Username: `admin`
- Password: `Patrimoine2024!`

---

## ⚠️ Important Notes

1. **Replace YOUR_PASSWORD** in DATABASE_URL with your actual Supabase password
2. **First deployment** takes 3-5 minutes
3. **Subsequent deploys** take 2 minutes
4. **Auto-deploys** on every git push

---

## 🔧 Troubleshooting

### If you get "Function Invocation Failed"

Check Vercel function logs:
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments"
4. Click latest deployment
5. Click "Functions" tab
6. Check the error logs

### If database connection fails

Verify your DATABASE_URL is correct:
- Has the right password
- No extra spaces
- Includes `?sslmode=require` at the end (optional but recommended)

---

## 💰 Cost

**100% FREE!**
- Vercel: Free tier (perfect for your needs)
- Supabase: Free tier (500MB - enough for 50K+ responses)

---

## 🎉 You're Done!

Your Moroccan Heritage Survey Platform is now live on Vercel with Supabase PostgreSQL!
