# Quick Start: Deploy ML API to Render

## Fastest Path to Production (5 minutes)

### Step 1: Commit and Push
```powershell
cd c:\Users\Jess\lulan-robot-web-dashboard

git add server/ml-api/
git commit -m "Add ML API deployment config"
git push origin develop
```

### Step 2: Deploy to Render

1. Go to https://render.com/
2. Click "Get Started for Free"
3. Sign up with GitHub
4. Click "New +" → "Web Service"
5. Click "Connect account" to link your GitHub
6. Find repository: `qjrlazo-gif/MedBot`
7. Click "Connect"

### Step 3: Configure Service

**Basic Settings:**
- Name: `lulan-ml-api`
- Region: `Oregon (US West)` (or closest to you)
- Branch: `develop`
- Root Directory: `server/ml-api`

**Build Settings:**
- Environment: `Python 3`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn --bind 0.0.0.0:$PORT app:app` (for production) OR `python app.py` (simpler)

**Plan:**
- Select: `Free`

Click "Create Web Service"

### Step 4: Wait for Deployment
- Watch the logs (2-3 minutes)
- Look for "✅ Model loaded" message
- Service URL appears at top: `https://lulan-ml-api.onrender.com`

### Step 5: Test Your Deployment

```powershell
# Replace with your actual Render URL
$API_URL = "https://lulan-ml-api.onrender.com"

# Test health endpoint
curl "$API_URL/health"

# Should return: {"model_loaded":true,"status":"healthy"}
```

### Step 6: Update Frontend Environment

Create `.env.production` in client folder:

```powershell
cd c:\Users\Jess\lulan-robot-web-dashboard\client

# Create file with your Render URL
@"
VITE_ML_API_URL=https://lulan-ml-api.onrender.com
"@ | Out-File -FilePath .env.production -Encoding utf8
```

### Step 7: Rebuild & Redeploy Frontend

```powershell
npm run build
firebase deploy
```

### Step 8: Verify Integration

1. Open: https://lulan-web-app-dashboard.web.app
2. Open browser DevTools (F12) → Console
3. Try voice command: "deliver morphine to ICU urgently"
4. Check console for ML API calls

---

## Expected Output

### Health Check:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### Prediction:
```json
{
  "intent": "delivery",
  "confidence": 0.92,
  "supplies": ["Morphine"],
  "destination": "ICU",
  "priority": "URGENT"
}
```

---

## Troubleshooting

**Build fails with "model.pkl not found":**
- Ensure `model.pkl` is committed to Git
- Check file size (should be ~50KB)
- Run `git lfs track "*.pkl"` if file is large

**Service won't start:**
- Check Render logs for Python errors
- Verify `requirements.txt` includes all dependencies

**CORS errors in browser:**
- Verify `flask-cors` installed
- Check Render logs for startup messages

**Cold start delays (Free tier):**
- First request after 15 min idle takes ~10-30s
- This is normal for free tier
- Upgrade to $7/month plan for instant response

---

## Alternative: Test Locally First

Before deploying, test the Docker container locally:

```powershell
cd c:\Users\Jess\lulan-robot-web-dashboard\server\ml-api

# Build image
docker build -t lulan-ml-api .

# Run container
docker run -p 5001:5001 lulan-ml-api

# Test
curl http://localhost:5001/health
```

---

## Need Help?

If you encounter issues:
1. Check Render deployment logs
2. Verify model.pkl is in repository
3. Test ML API health endpoint first
4. Check browser console for specific errors
