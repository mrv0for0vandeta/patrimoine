# 🚀 Deploy to Cloudflare Pages - Complete Guide

Cloudflare Pages is **better than Vercel** for this project because:
- ✅ Unlimited bandwidth (no limits!)
- ✅ Better PostgreSQL support
- ✅ Faster global CDN
- ✅ Simpler configuration
- ✅ More generous free tier

---

## 🎯 Quick Deploy (3 Steps - 5 Minutes)

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

### Step 3: Create Project & Deploy

#### Option A: Deploy from Dashboard (Recommended)

1. **Go to:** https://dash.cloudflare.com/
2. **Click:** "Workers & Pages" in the left sidebar
3. **Click:** "Create application" → "Pages" → "Connect to Git"
4. **Select:** Your GitHub repository: `mrv0for0vandeta/patrimoine`
5. **Configure build settings:**
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `frontend`
6. **Click:** "Save and Deploy"

#### Option B: Deploy from Command Line

```bash
# From your project directory
npm run deploy:cloudflare
```

---

## ⚙️ Configure Environment Variables

After creating the project, add environment variables:

### Via Cloudflare Dashboard:

1. Go to: https://dash.cloudflare.com/
2. Click: "Workers & Pages" → Your project
3. Click: "Settings" tab → "Environment variables"
4. Add these 7 variables for **Production**:

| Variable Name | Value |
|---------------|-------|
| `DATABASE_URL` | `postgresql://postgres.elswjgrymyiklvsjimav:Medmahdi2025+@aws-0-us-east-1.pooler.supabase.com:6543/postgres` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `moroccan_heritage_jwt_secret_2024_secure_minimum_32_chars` |
| `SESSION_SECRET` | `moroccan_session_secret_2024_secure_minimum_32_chars` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `Patrimoine2024!` |
| `ADMIN_EMAIL` | `admin@patrimoine.gov.ma` |

5. Click "Save" after each variable

### Via Command Line (Alternative):

```bash
wrangler pages secret put DATABASE_URL
# Paste: postgresql://postgres.elswjgrymyiklvsjimav:Medmahdi2025+@aws-0-us-east-1.pooler.supabase.com:6543/postgres

wrangler pages secret put NODE_ENV
# Enter: production

wrangler pages secret put JWT_SECRET
# Paste: moroccan_heritage_jwt_secret_2024_secure_minimum_32_chars

wrangler pages secret put SESSION_SECRET
# Paste: moroccan_session_secret_2024_secure_minimum_32_chars

wrangler pages secret put ADMIN_USERNAME
# Enter: admin

wrangler pages secret put ADMIN_PASSWORD
# Enter: Patrimoine2024!

wrangler pages secret put ADMIN_EMAIL
# Enter: admin@patrimoine.gov.ma
```

---

## 🔄 Redeploy After Adding Variables

After adding environment variables, trigger a new deployment:

### Via Dashboard:
1. Go to "Deployments" tab
2. Click "Retry deployment" on the latest deployment

### Via Git:
```bash
git commit --allow-empty -m "Trigger Cloudflare redeploy"
git push origin main
```

---

## ✅ Verify Deployment

After deployment completes (1-2 minutes):

### 1. Check Homepage:
Visit: `https://moroccan-heritage-survey.pages.dev/`

Should show: Survey platform homepage ✅

### 2. Check Health API:
Visit: `https://moroccan-heritage-survey.pages.dev/api/health`

Should return:
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected"
}
```

### 3. Check Admin Panel:
Visit: `https://moroccan-heritage-survey.pages.dev/admin`

Login with:
- **Username:** `admin`
- **Password:** `Patrimoine2024!`

---

## 🌐 Custom Domain (Optional)

Add your own domain:

1. Go to: "Custom domains" tab in your project
2. Click: "Set up a custom domain"
3. Enter your domain: `patrimoine.example.com`
4. Follow the DNS configuration instructions
5. Wait for SSL certificate to be issued (~5 minutes)

---

## 📊 Project Structure for Cloudflare

```
patrimoine/
├── functions/              # Cloudflare Pages Functions
│   └── api/
│       └── [[path]].js    # API handler (all /api/* routes)
├── frontend/              # Static frontend files
│   ├── index.html
│   ├── survey.html
│   ├── admin/
│   ├── css/
│   └── js/
├── backend/               # Backend code (used by functions)
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── wrangler.toml          # Cloudflare configuration
└── _routes.json           # Route configuration
```

---

## 🔧 How It Works

### Cloudflare Pages Functions:
- All `/api/*` requests → `functions/api/[[path]].js`
- Static files → Served from `frontend/` directory
- Environment variables → Injected via `context.env`

### Database Connection:
- Uses `backend/utils/database.js` (auto-detecting)
- In production: Detects PostgreSQL → Uses Supabase
- Environment variables from Cloudflare dashboard

---

## 🆚 Cloudflare vs Vercel vs Railway

| Feature | Cloudflare Pages | Vercel | Railway |
|---------|------------------|--------|---------|
| **Bandwidth** | Unlimited | 100GB/month | Limited |
| **Build Minutes** | 500/month | 6000/month | 500 hrs |
| **Functions** | 100,000/day | 100GB-hrs/month | Unlimited |
| **Edge Network** | 300+ cities | 100+ cities | Limited |
| **PostgreSQL** | External only | External only | Built-in |
| **Custom Domains** | Free SSL | Free SSL | Free SSL |
| **Price (Free)** | Best | Good | Good |

**Verdict:** Cloudflare Pages is best for high-traffic applications.

---

## 🐛 Troubleshooting

### Issue: "Module not found" error

**Solution:** Make sure `package.json` includes all dependencies:
```bash
npm install
```

### Issue: 500 Internal Server Error

**Solution:** Check environment variables are set correctly:
1. Go to Settings → Environment variables
2. Verify all 7 variables are present
3. Redeploy

### Issue: Database connection failed

**Solution:** Verify DATABASE_URL is correct:
- Should start with `postgresql://`
- Should include Supabase credentials
- Test connection locally first

### Issue: Functions not working

**Solution:** Check `_routes.json` exists and includes `/api/*`

---

## 📝 View Logs

### Via Dashboard:
1. Go to your project
2. Click "Deployments" tab
3. Click on a deployment
4. Scroll down to see "Function logs"

### Via Wrangler:
```bash
wrangler pages deployment tail
```

---

## 🔄 GitHub Integration

Once connected to GitHub, Cloudflare automatically:
- Deploys on every push to `main` branch
- Creates preview deployments for pull requests
- Shows deployment status in GitHub commits

**Enable automatic deployments:**
1. Connect GitHub repository
2. Cloudflare will add a webhook
3. Every push triggers a new deployment

---

## 🎯 Quick Commands Reference

```bash
# Login
wrangler login

# Deploy manually
npm run deploy:cloudflare

# Add environment variable
wrangler pages secret put VARIABLE_NAME

# View logs
wrangler pages deployment tail

# List deployments
wrangler pages deployments list

# View project info
wrangler pages project list
```

---

## 📚 Additional Resources

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Wrangler CLI Docs:** https://developers.cloudflare.com/workers/wrangler/
- **Functions Docs:** https://developers.cloudflare.com/pages/functions/
- **Supabase Docs:** https://supabase.com/docs

---

## ✅ Success Checklist

- [ ] Wrangler CLI installed
- [ ] Logged in to Cloudflare
- [ ] Project created/deployed
- [ ] All 7 environment variables added
- [ ] Redeployed after adding variables
- [ ] Homepage loads without errors
- [ ] `/api/health` returns success
- [ ] Admin panel accessible
- [ ] Can login to admin panel

---

## 🎉 Next Steps After Deployment

1. **Test all features:**
   - Create a survey
   - Submit responses
   - View analytics
   - Export data

2. **Configure custom domain** (optional)

3. **Set up monitoring:**
   - Enable Cloudflare analytics
   - Set up error alerts

4. **Optimize:**
   - Enable Cloudflare caching
   - Configure security rules
   - Set up rate limiting

---

**Deployment URL:** `https://moroccan-heritage-survey.pages.dev/`

**Admin Panel:** `https://moroccan-heritage-survey.pages.dev/admin`

**API Health:** `https://moroccan-heritage-survey.pages.dev/api/health`

---

Made with ❤️ for Moroccan Cultural Heritage Preservation
