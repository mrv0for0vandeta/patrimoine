# Installation Fix Guide

## Problem
The npm installation is failing because `better-sqlite3` requires C++ build tools which are not installed.

## Solution Options

### Option 1: Install Build Tools (Recommended for Production)

1. **Install Visual Studio Build Tools:**
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Select "Build Tools for Visual Studio 2022"
   - During installation, select "Desktop development with C++"
   - This is about 6-7 GB download

2. **After installation, run:**
   ```bash
   npm install
   ```

### Option 2: Use Pre-built Binaries (Quick Fix)

Run this command to try using pre-built binaries:
```bash
npm install --ignore-scripts
npm install better-sqlite3 --build-from-source=false
```

### Option 3: Alternative Database (If Build Tools Cannot Be Installed)

Replace `better-sqlite3` with `sqlite3` (pure JavaScript):

1. **Update package.json:**
   Replace:
   ```json
   "better-sqlite3": "^9.2.2"
   ```
   With:
   ```json
   "sqlite3": "^5.1.7"
   ```

2. **Update database.js to use sqlite3 instead**

### Option 4: Use Existing Node Modules (If Previously Working)

If you had a working installation before:
1. Copy the `node_modules` folder from the working installation
2. Place it in the project root

## Quick Start (Skip Installation Issues)

For immediate testing without full npm install:

1. **Install only critical packages manually:**
   ```bash
   npm install express cors dotenv
   ```

2. **Download better-sqlite3 pre-built binary:**
   - Go to: https://github.com/WiseLibs/better-sqlite3/releases
   - Download the appropriate `.node` file for your system
   - Place in `node_modules/better-sqlite3/build/Release/`

## Current Status

The project structure is complete:
- ✅ All backend code written
- ✅ All frontend code (HTML, CSS, JS) written
- ✅ Database schema created
- ✅ Survey data ready (Q1_PRIMARY.json created)
- ❌ npm dependencies not installed (build tool issue)

## Next Steps After Fixing Installation

Once npm install works:

1. **Initialize database:**
   ```bash
   npm run init-db
   ```

2. **Seed survey metadata:**
   ```bash
   npm run seed
   ```

3. **Import Q1 questions:**
   ```bash
   node backend/utils/import-from-json.js Q1_PRIMARY
   ```

4. **Start server:**
   ```bash
   npm start
   ```

5. **Access application:**
   - Frontend: http://localhost:3000
   - Admin: http://localhost:3000/admin
   - API: http://localhost:3000/api

## Alternative: Docker Installation

If build tools installation is problematic, consider using Docker:

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t heritage-survey .
docker run -p 3000:3000 heritage-survey
```
