# ML API Deployment - Complete Setup

## 📦 What's Been Prepared

### Server Files (server/ml-api/)
- ✅ `app.py` - Flask ML API (updated with PORT env support)
- ✅ `model.pkl` - Trained scikit-learn model (8.99 KB)
- ✅ `requirements.txt` - Python dependencies (with gunicorn)
- ✅ `Dockerfile` - Container configuration
- ✅ `.dockerignore` - Docker build exclusions
- ✅ `render.yaml` - Render deployment config
- ✅ `railway.json` - Railway deployment config
- ✅ `vercel.json` - Vercel deployment config
- ✅ `ML_API_DEPLOYMENT.md` - Full deployment guide
- ✅ `QUICK_START.md` - Fast deployment instructions

### Client Files
- ✅ `.env.production.template` - Environment variable template
- ✅ `nlpParser.ts` - Updated (gauze → Gauze, morphine normalization)
- ✅ Verification tool: `tools/verify-ml-deployment.js`

---

## 🚀 Deployment Options

### Option 1: Render (Recommended)
**Best for:** Production use, free tier available
**Time:** 5 minutes
**Cost:** Free (with cold starts) or $7/month (instant response)

[See: server/ml-api/QUICK_START.md]

### Option 2: Railway
**Best for:** Quick prototypes, no cold starts
**Time:** 3 minutes
**Cost:** Free trial ($5 credit)

### Option 3: Google Cloud Run
**Best for:** Enterprise scale, pay-per-use
**Time:** 10 minutes (requires gcloud CLI)
**Cost:** Free tier (2M requests/month)

### Option 4: Fly.io
**Best for:** Edge deployment, low latency
**Time:** 5 minutes (requires flyctl CLI)
**Cost:** Free tier available

---

## 📋 Step-by-Step: Render Deployment (Fastest)

### 1. Commit & Push ML API Files

```powershell
cd c:\Users\Jess\lulan-robot-web-dashboard

# Add ML API files
git add server/ml-api/
git add tools/verify-ml-deployment.js
git add client/.env.production.template

# Commit
git commit -m "Add ML API deployment configuration"

# Push to GitHub
git push origin develop
```

### 2. Deploy to Render

1. **Sign up:** https://render.com (use GitHub login)

2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Select repository: `qjrlazo-gif/MedBot`
   - Click "Connect"

3. **Configure:**
   ```
   Name:           lulan-ml-api
   Region:         Oregon (US West)
   Branch:         develop
   Root Directory: server/ml-api
   Environment:    Python 3
   Build Command:  pip install -r requirements.txt
   Start Command:  python app.py
   Plan:           Free
   ```

4. **Click "Create Web Service"**

5. **Wait 2-3 minutes** for deployment

6. **Copy URL** (e.g., `https://lulan-ml-api.onrender.com`)

### 3. Verify Deployment

```powershell
# Test using verification script
node tools/verify-ml-deployment.js https://lulan-ml-api.onrender.com
```

Expected output:
```
✅ Health check passed
✅ Prediction test passed
✅ CORS configured correctly
✅ All tests passed! ML API is ready for production.
```

### 4. Update Frontend Environment

```powershell
cd c:\Users\Jess\lulan-robot-web-dashboard\client

# Create .env.production with your Render URL
@"
VITE_ML_API_URL=https://lulan-ml-api.onrender.com
"@ | Out-File -FilePath .env.production -Encoding utf8
```

### 5. Rebuild & Redeploy Frontend

```powershell
# Build with production environment
npm run build

# Deploy to Firebase
firebase deploy
```

### 6. Test Live Integration

1. Open: https://lulan-web-app-dashboard.web.app
2. Press F12 (DevTools) → Console tab
3. Try voice command: **"deliver morphine to ICU urgently"**
4. Check console logs for:
   ```
   Parsed intent: {
     supplies: ["Morphine"],
     destination: "ICU",
     priority: "High",
     confidence: 0.92
   }
   ```

---

## 🧪 Testing Commands

### Test ML API Directly (PowerShell)

```powershell
# Set your API URL
$API_URL = "https://lulan-ml-api.onrender.com"

# Health check
Invoke-RestMethod -Uri "$API_URL/health"

# Single prediction
$body = @{
    text = "bring morphine to ICU urgently"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$API_URL/predict" -Method POST -Body $body -ContentType "application/json"
```

### Expected Responses

**Health:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

**Prediction:**
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

## ⚙️ How It Works

### Current State (No ML in Production)
```
Voice Input → Dictionary Parser (nlpParser.ts) → Task Creation
             ↑
             Only uses pattern matching
```

### After Deployment (Hybrid ML)
```
Voice Input → Dictionary Parser (nlpParser.ts) → Check confidence
             ↓ (if < 0.6)
             ML API (Flask + scikit-learn) → Enhanced prediction → Task Creation
             ↑
             Uses TF-IDF + Naive Bayes
```

### Benefits of ML Integration
- ✅ Better handling of variations: "get me some gloves" vs "bring gloves"
- ✅ Handles typos and speech recognition errors
- ✅ Learns from patterns in training data (10,000 commands)
- ✅ Provides confidence scores for ambiguous commands
- ✅ Fallback for complex/unusual phrasings

---

## 🐛 Troubleshooting

### Issue: "Model not loaded" error
**Solution:** Verify `model.pkl` is in git repository
```powershell
cd c:\Users\Jess\lulan-robot-web-dashboard\server\ml-api
git add -f model.pkl
git commit -m "Ensure model.pkl is tracked"
git push
```

### Issue: Cold start delays (15-30 seconds first request)
**Cause:** Render free tier spins down after 15 min inactivity
**Solutions:**
- Accept delay (normal for free tier)
- Upgrade to paid tier ($7/month) for instant response
- Use Railway (no cold starts, but free trial limited)

### Issue: CORS errors in browser
**Check:**
1. Verify `flask-cors` installed in `requirements.txt`
2. Check Render logs for "CORS enabled" message
3. Test with `curl` first to isolate CORS issue

### Issue: 500 Internal Server Error
**Check Render logs:**
1. Click your service → "Logs" tab
2. Look for Python errors
3. Verify all dependencies installed

### Issue: Frontend still uses dictionary only
**Verify:**
1. `.env.production` exists with correct URL
2. Rebuilt with `npm run build` AFTER creating .env
3. Redeployed with `firebase deploy`
4. Check browser console for ML API calls

---

## 📊 Monitoring

### Check ML API Health
```powershell
curl https://lulan-ml-api.onrender.com/health
```

### Check Frontend Environment
```powershell
cd c:\Users\Jess\lulan-robot-web-dashboard\client\dist
cat assets/index-*.js | Select-String "ML_API_URL"
```

### View Render Logs
1. Go to Render dashboard
2. Click your service
3. Click "Logs" tab
4. Watch real-time requests

---

## 💰 Cost Estimate

### Render Free Tier
- ✅ 750 hours/month (enough for 24/7 uptime)
- ✅ Automatic HTTPS
- ✅ Automatic deployments
- ⚠️ Cold starts after 15 min idle
- ✅ 100GB bandwidth/month

### Paid Tier ($7/month)
- ✅ No cold starts
- ✅ 400 hours compute (24/7)
- ✅ Priority support
- ✅ Better for production

---

## 📝 Next Steps After Deployment

1. **Test thoroughly:**
   - Try 10+ different voice commands
   - Verify confidence scores in console
   - Check ML API is responding (not falling back to dictionary)

2. **Monitor usage:**
   - Watch Render dashboard for request counts
   - Check error rates
   - Review response times

3. **Optional improvements:**
   - Add authentication to ML API
   - Set up Render alerts for downtime
   - Collect feedback on ML accuracy
   - Retrain model with real user commands

4. **Production considerations:**
   - Consider paid tier if cold starts are issue
   - Set up monitoring/alerting
   - Add rate limiting to prevent abuse
   - Backup model.pkl to cloud storage

---

## 🎯 Success Criteria

✅ ML API health endpoint returns `model_loaded: true`
✅ Prediction endpoint returns valid responses
✅ Frontend connects to ML API (check browser console)
✅ Voice commands show ML confidence scores
✅ Complex commands handled better than before
✅ No console errors related to ML API

---

## 📚 Documentation Reference

- Full guide: `server/ml-api/ML_API_DEPLOYMENT.md`
- Quick start: `server/ml-api/QUICK_START.md`
- Verification: `tools/verify-ml-deployment.js`
- Environment: `client/.env.production.template`

---

## 🆘 Need Help?

If you get stuck:
1. Check Render deployment logs
2. Run verification script: `node tools/verify-ml-deployment.js <url>`
3. Test ML API directly with curl
4. Verify `.env.production` is correct
5. Rebuild frontend after env changes
6. Check browser console for errors

**Common mistakes:**
- Forgot to push `model.pkl` to git
- Didn't create `.env.production`
- Rebuilt before creating .env file
- Deployed to wrong branch

---

Ready to deploy? Start with Step 1 above! 🚀
