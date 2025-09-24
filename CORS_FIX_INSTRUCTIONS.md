# 🔧 **CORS ERROR FIX - BACKEND UPDATE NEEDED**

## **🚨 Issue Identified**

Your Netlify app (`luxury-begonia-e85c75.netlify.app`) cannot access the backend API due to CORS restrictions. The backend server needs to be updated to allow requests from Netlify domains.

## **✅ Fix Applied**

I've updated the CORS configuration in `server.js` to automatically allow:
- ✅ **Netlify domains** (*.netlify.app, *.netlify.com)
- ✅ **Vercel domains** (*.vercel.app, *.vercel.com)  
- ✅ **Localhost** (for development)
- ✅ **Chrome extensions** (chrome-extension://)

---

## **🚀 DEPLOY UPDATED BACKEND TO GOOGLE CLOUD RUN**

### **Option 1: Using Google Cloud CLI (If Available)**

```bash
# Navigate to project directory
cd /Users/devanshsuri/Calert-V2

# Deploy to Google Cloud Run
gcloud run deploy calert-backend \
  --source . \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --set-env-vars="API_KEY=AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg,APP_TOKEN=calert-secure-token-2024" \
  --project calert-h175v
```

### **Option 2: Using Google Cloud Console**

1. **Go to**: https://console.cloud.google.com/run
2. **Select project**: `calert-h175v`
3. **Find service**: `calert-backend` 
4. **Click "Edit & Deploy New Revision"**
5. **Container tab**: Set source to this GitHub repo
6. **Variables & Secrets**: 
   - `API_KEY` = `AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg`
   - `APP_TOKEN` = `calert-secure-token-2024`
7. **Deploy**

### **Option 3: GitHub Actions Auto-Deploy**

The project includes GitHub Actions CI/CD. If connected to Cloud Run, it should auto-deploy when you push to main.

---

## **🧪 TEMPORARY WORKAROUND**

While the backend is being updated, you can test locally:

```bash
# Start local backend with CORS fix
cd /Users/devanshsuri/Calert-V2
PORT=8081 API_KEY=AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg APP_TOKEN=calert-secure-token-2024 node server.js

# Update config to use local backend
# In browser console of your Netlify app:
localStorage.setItem('calert_server_override', 'http://localhost:8081');
```

---

## **🔍 VERIFY THE FIX**

After backend deployment:

1. **Visit your Netlify app**: https://luxury-begonia-e85c75.netlify.app
2. **Open browser dev tools** (F12)
3. **Try logging in** with Google
4. **Check console**: Should see successful API calls instead of CORS errors
5. **Test calendar loading**: Should work without "Failed to fetch" errors

---

## **📱 NEXT STEPS AFTER BACKEND UPDATE**

1. ✅ **Backend deployed** with CORS fix
2. ✅ **Frontend working** on Netlify 
3. ✅ **Install Chrome extension** from `/dist` folder
4. ✅ **Test full workflow** (login → calendar → notifications)

---

## **🎯 RECOMMENDED ACTION**

**Deploy the backend using Option 2 (Google Cloud Console)** as it's the most straightforward:

1. Go to https://console.cloud.google.com/run
2. Update the `calert-backend` service
3. Deploy the new revision
4. Test your Netlify app

Your CORS issue will be resolved once the backend is updated! 🚀