# Render Deployment Fix

## The Problem
Render failed with: `Service Root Directory "/opt/render/project/src/server/ml-api" is missing`

This happens because the Root Directory wasn't set correctly during service creation.

---

## ✅ Solution: Set Root Directory in Render UI

### Step-by-Step Fix:

1. **Go to Render Dashboard:** https://dashboard.render.com

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `qjrlazo-gif/MedBot`
   - Click "Connect"

3. **⚠️ IMPORTANT - Configure Root Directory:**
   ```
   Name:              lulan-ml-api
   Region:            Oregon (US West)
   Branch:            develop
   Root Directory:    server/ml-api    ← CRITICAL: Don't forget this!
   Runtime:           Python 3
   Build Command:     pip install -r requirements.txt
   Start Command:     python app.py
   Instance Type:     Free
   ```

4. **Add Environment Variables:**
   - Click "Add Environment Variable"
   - Key: `PYTHON_VERSION`, Value: `3.11.0`
   - Key: `PORT`, Value: `5001`

5. **Click "Create Web Service"**

---

## Alternative: Deploy Using render.yaml (Automatic)

If you want Render to use the configuration file automatically:

### Step 1: Update render.yaml
The file has been updated with `rootDir: server/ml-api`

### Step 2: Commit and Push
```powershell
cd c:\Users\Jess\lulan-robot-web-dashboard
git add server/ml-api/render.yaml RENDER_FIX.md
git commit -m "Fix Render deployment - add rootDir to config"
git push origin develop
```

### Step 3: Deploy Using Blueprint
1. Go to Render Dashboard
2. Click "New +" → "Blueprint"
3. Connect repository: `qjrlazo-gif/MedBot`
4. Select `server/ml-api/render.yaml`
5. Click "Apply"

Render will automatically use the `rootDir` setting from the YAML file.

---

## Verify After Deployment

Once deployed (takes ~2-3 minutes):

```powershell
# Get your service URL from Render dashboard, then:
curl https://lulan-ml-api.onrender.com/health

# Should return:
# {"model_loaded":true,"status":"healthy"}
```

---

## Quick Checklist

- [ ] Root Directory set to `server/ml-api`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `python app.py`
- [ ] Environment variables added (PYTHON_VERSION, PORT)
- [ ] Deployment logs show "Model loaded"
- [ ] Health endpoint returns `model_loaded: true`

---

## Common Render UI Mistakes

❌ **Don't do this:**
- Leaving Root Directory empty
- Setting Root Directory to `/server/ml-api` (no leading slash!)
- Using `gunicorn` without proper configuration

✅ **Do this:**
- Root Directory: `server/ml-api` (relative path, no leading/trailing slashes)
- Start Command: `python app.py` (simple and works)
- Verify in logs that "Model loaded" appears

---

## Next Steps After Successful Deployment

1. **Copy your Render URL** (e.g., `https://lulan-ml-api.onrender.com`)

2. **Configure frontend:**
   ```powershell
   .\tools\configure-ml-env.ps1 https://lulan-ml-api.onrender.com
   ```

3. **Deploy frontend:**
   ```powershell
   cd client
   npm run build
   firebase deploy
   ```

4. **Test integration:**
   ```powershell
   node tools/verify-ml-deployment.js https://lulan-ml-api.onrender.com
   ```

---

That's it! The key is setting the Root Directory correctly. 🚀
