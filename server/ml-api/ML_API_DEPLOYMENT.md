# ML API Deployment Guide

This guide covers deploying your Flask ML API to various cloud platforms.

## Prerequisites

- Trained model file: `model.pkl` (already present)
- Python dependencies: `requirements.txt`
- Flask app: `app.py`

---

## Option 1: Render (Recommended - Free Tier Available)

**Pros:** Free tier, easy setup, automatic HTTPS, good for production
**Cons:** Cold starts on free tier (spins down after 15 min inactivity)

### Steps:

1. **Sign up at [Render.com](https://render.com)**

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository or deploy from Git URL
   - Select the `server/ml-api` directory

3. **Configure Service:**
   - **Name:** `lulan-ml-api`
   - **Region:** Oregon (US West) or closest to you
   - **Branch:** `develop`
   - **Root Directory:** `server/ml-api`
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python app.py`
   - **Plan:** Free

4. **Environment Variables:**
   - Add: `PYTHON_VERSION` = `3.11.0`
   - Add: `PORT` = `5001`

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - Copy your service URL (e.g., `https://lulan-ml-api.onrender.com`)

6. **Test:**
   ```powershell
   curl https://lulan-ml-api.onrender.com/health
   ```

---

## Option 2: Railway (Easy, Free Trial)

**Pros:** Very easy setup, generous free trial, no cold starts
**Cons:** Free trial expires after ~$5 credit used

### Steps:

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create New Project:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Dockerfile

3. **Configure:**
   - Root directory: `server/ml-api`
   - Port: `5001`
   - Domain: Generate a public domain

4. **Deploy:**
   - Railway automatically builds and deploys
   - Copy your service URL

---

## Option 3: Google Cloud Run (Scalable, Pay-as-you-go)

**Pros:** Auto-scaling, generous free tier (2M requests/month), fast cold starts
**Cons:** Requires Google Cloud account and `gcloud` CLI

### Steps:

1. **Install Google Cloud SDK:**
   ```powershell
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Build and Push Docker Image:**
   ```powershell
   cd c:\Users\Jess\lulan-robot-web-dashboard\server\ml-api

   # Authenticate
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID

   # Build image
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/lulan-ml-api

   # Deploy to Cloud Run
   gcloud run deploy lulan-ml-api `
     --image gcr.io/YOUR_PROJECT_ID/lulan-ml-api `
     --platform managed `
     --region us-central1 `
     --allow-unauthenticated `
     --port 5001
   ```

3. **Copy Service URL** from output (e.g., `https://lulan-ml-api-xxx-uc.a.run.app`)

---

## Option 4: Fly.io (Good Performance)

**Pros:** Edge deployment, good free tier, no cold starts
**Cons:** Requires `flyctl` CLI

### Steps:

1. **Install Fly CLI:**
   ```powershell
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Deploy:**
   ```powershell
   cd c:\Users\Jess\lulan-robot-web-dashboard\server\ml-api
   
   fly auth login
   fly launch --name lulan-ml-api --region ord
   fly deploy
   ```

3. **Get URL:**
   ```powershell
   fly status
   ```

---

## After Deployment: Update Frontend

Once deployed, update your frontend to use the live ML API:

1. **Create production environment file:**

   ```powershell
   cd c:\Users\Jess\lulan-robot-web-dashboard\client
   ```

   Create `.env.production`:
   ```
   VITE_ML_API_URL=https://your-deployed-ml-api.onrender.com
   ```

2. **Rebuild and redeploy frontend:**

   ```powershell
   npm run build
   firebase deploy
   ```

3. **Test:**
   - Open your live app: https://lulan-web-app-dashboard.web.app
   - Open browser console
   - Try a voice command: "deliver gloves to room A1"
   - Check console logs for "ML API prediction" entries

---

## Verifying ML Integration

### Test ML API Directly:

```powershell
# Replace with your deployed URL
$API_URL = "https://lulan-ml-api.onrender.com"

# Test health
curl $API_URL/health

# Test prediction
$body = @{
    text = "bring morphine to ICU urgently"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$API_URL/predict" -Method POST -Body $body -ContentType "application/json"
```

Expected response:
```json
{
  "intent": "delivery",
  "confidence": 0.95,
  "supplies": ["Morphine"],
  "destination": "ICU",
  "priority": "URGENT"
}
```

---

## Troubleshooting

### Cold Starts (Render Free Tier)
- First request after 15min idle takes ~10-30s
- Subsequent requests are instant
- Consider upgrading to paid tier ($7/month) to eliminate cold starts

### CORS Errors
- Verify `flask-cors` is installed
- Check `CORS(app)` is called in `app.py`

### Model Not Loading
- Ensure `model.pkl` is committed to repository
- Check deployment logs for "Model loaded" message

### 500 Errors
- Check deployment logs
- Verify all dependencies in `requirements.txt`
- Test prediction payload format

---

## Recommended: Render Deployment

For your use case, I recommend **Render** because:
- ✅ Free tier available
- ✅ Easy setup (no CLI required)
- ✅ Automatic HTTPS
- ✅ GitHub integration
- ✅ Good for production workloads
- ✅ Generous free tier limits

The only downside is cold starts on free tier, but for a hospital dashboard with regular usage, this is minimal impact.
