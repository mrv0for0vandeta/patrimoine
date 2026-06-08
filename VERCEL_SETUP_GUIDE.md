# 🚀 Deploy to Vercel with Neon PostgreSQL

Your app is now ready for Vercel! I've converted it to use **Neon PostgreSQL** instead of SQLite.

---

## ✅ What Changed

- ✅ Added Neon PostgreSQL adapter (`@neondatabase/serverless`)
- ✅ Updated `vercel.json` configuration
- ✅ Database layer now uses PostgreSQL
- ✅ Serverless-ready architecture

---

## 📦 Step 1: Create Neon Database (FREE)

### 1.1 Sign Up for Neon

Go to: **https://neon.tech**

Click **"Sign Up"** → Use GitHub

### 1.2 Create Project

1. Click **"Create Project"**
2. **Name**: `patrimoine-survey`
3. **Region**: Frankfurt (closest to Morocco)
4. **PostgreSQL Version**: 16 (default)
5. Click **"Create Project"**

### 1.3 Get Connection String

After creation, you'll see:
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Copy this entire string!** You'll need it for Vercel.

---

## 🚀 Step 2: Deploy to Vercel

### 2.1 Push Code to GitHub

```bash
git add .
git commit -m "Add Vercel and Neon PostgreSQL support"
git push origin main
```

### 2.2 Import to Vercel

1. Go to: **https://vercel.com**
2. Click **"Add New"** → **"Project"**
3. **Import Git Repository**: `mrv0for0vandeta/patrimoine`
4. Click **"Import"**

### 2.3 Configure Environment Variables

Before deploying, add these environment variables:

Click **"Environment Variables"** and add:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Or use POSTGRES_URL if Vercel integration
POSTGRES_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# App Configuration
NODE_ENV=production

# Security (CHANGE THESE!)
JWT_SECRET=moroccan_heritage_jwt_secret_key_2024_minimum_32_chars
SESSION_SECRET=moroccan_heritage_session_key_2024_minimum_32_chars

# Admin Account (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_EMAIL=admin@patrimoine.gov.ma

# Optional
CORS_ORIGIN=*
```

### 2.4 Deploy!

Click **"Deploy"** and wait 2-3 minutes.

Your app will be live at: `https://patrimoine-xxxx.vercel.app`

---

## 🗄️ Step 3: Initialize Database

After first deployment, you need to initialize the database schema.

### Option A: Use Neon SQL Editor

1. Go to your Neon dashboard
2. Click **"SQL Editor"**
3. Run this SQL:

```sql
-- The schema is automatically created on first connection
-- Just verify by running:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Option B: Create Init Script

Create a one-time initialization endpoint (I'll add this):

---

## ✅ Verification

### Test Endpoints:

1. **Health Check**:
   ```
   https://your-app.vercel.app/health
   ```
   Should return: `{"success":true, "status":"healthy"}`

2. **API Info**:
   ```
   https://your-app.vercel.app/api
   ```
   Should return API information

3. **Frontend**:
   ```
   https://your-app.vercel.app
   ```
   Should show your landing page

4. **Admin Login**:
   ```
   https://your-app.vercel.app/admin
   ```
   Login with your credentials

---

## 💾 Neon Free Tier Limits

**What's Free:**
- ✅ 512MB storage (enough for 50K+ responses!)
- ✅ 1 project
- ✅ 10 branches
- ✅ Unlimited compute time
- ✅ Always available

**For 5K responses:**
- Each response: ~10KB
- 5K responses: ~50MB
- **You'll use only 10% of free tier!**

---

## 🔄 Database Migration from SQLite

If you have existing SQLite data, you need to migrate it. Options:

### Option 1: Fresh Start
- Deploy with empty database
- Import survey definitions from JSON files
- Start collecting new responses

### Option 2: Migrate Existing Data
I can help you:
1. Export SQLite data to SQL
2. Convert to PostgreSQL format
3. Import to Neon

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL is not defined"

**Solution:** Add `DATABASE_URL` or `POSTGRES_URL` in Vercel environment variables

### Error: "relation does not exist"

**Solution:** Database schema not initialized. The schema auto-creates on first connection with the new adapter.

### Error: "too many connections"

**Solution:** Neon handles connection pooling automatically. This shouldn't happen.

### App Returns 500 Error

**Solution:** 
1. Check Vercel logs: **Project** → **Deployments** → Click deployment → **Functions** tab
2. Verify `DATABASE_URL` is correct
3. Ensure database is accessible

---

## 📊 Monitoring

### View Logs:

1. Go to Vercel dashboard
2. Click your project
3. **Deployments** → Select deployment
4. Click **"Functions"** tab to see logs

### Database Stats:

1. Go to Neon dashboard
2. Click your project
3. View **"Monitoring"** tab for:
   - Storage usage
   - Query performance
   - Connection stats

---

## 🔐 Security Checklist

Before making public:

- [ ] Changed `ADMIN_PASSWORD` from default
- [ ] Changed `JWT_SECRET` (32+ characters)
- [ ] Changed `SESSION_SECRET` (32+ characters)
- [ ] Verified `DATABASE_URL` is correct
- [ ] Set proper `CORS_ORIGIN` if needed
- [ ] Tested admin login
- [ ] Tested survey submission
- [ ] Verified data is saving

---

## 💰 Cost

**Both Free:**
- ✅ **Vercel**: Free tier (100GB bandwidth, commercial use allowed)
- ✅ **Neon**: Free tier (512MB database)

**Total Monthly Cost: $0** 🎉

**Upgrade if needed:**
- Vercel Pro: $20/month (more bandwidth)
- Neon Scale: $19/month (3GB storage)

For 5K responses, free tier is MORE than enough!

---

## 🎯 Next Steps

1. ✅ Push code to GitHub
2. ✅ Create Neon database
3. ✅ Deploy to Vercel
4. ✅ Add environment variables
5. ✅ Test the deployment
6. ✅ Share your live URL!

---

## 🆘 Need Help?

If you encounter any issues:
1. Check Vercel function logs
2. Verify DATABASE_URL is set correctly
3. Test database connection in Neon dashboard
4. Let me know the specific error!

---

**Your app is now serverless and ready for Vercel!** 🚀
