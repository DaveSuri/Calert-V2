# 🚀 **BACKEND CORS FIX - DEPLOY TO GOOGLE CLOUD RUN**

## **✅ CORS Configuration Applied**

I've implemented the CORS fix you suggested, specifically adapted for your Express.js backend:

### **What's Fixed:**
- ✅ **Explicit Netlify domain support**: `https://luxury-begonia-e85c75.netlify.app`
- ✅ **Wildcard Netlify support**: All `*.netlify.app` domains
- ✅ **Preflight OPTIONS handling**: For complex CORS requests
- ✅ **Proper headers**: `Content-Type`, `Authorization`, `X-App-Token`
- ✅ **Methods allowed**: `GET`, `POST`, `OPTIONS`

---

## **🌐 DEPLOY TO GOOGLE CLOUD RUN**

Based on your deployment configuration (backend URL: `https://calert-360373462324.us-west1.run.app`), deploy the updated backend:

### **Method 1: Google Cloud Console (Recommended)**

1. **Go to**: https://console.cloud.google.com/run?project=calert-h175v
2. **Find service**: `calert-backend` 
3. **Click**: "Edit & Deploy New Revision"
4. **Source**: 
   - Connect to GitHub: `DaveSuri/Calert-V2`
   - Branch: `main` (latest with CORS fixes)
5. **Environment Variables**:
   ```
   API_KEY=AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg
   APP_TOKEN=calert-secure-token-2024
   ```
6. **Click**: "Deploy"

### **Method 2: Google Cloud CLI**

```bash
# Make sure you're in the project directory
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

### **Method 3: GitHub Actions (If configured)**

Since you've pushed to GitHub, if you have CI/CD set up, it should auto-deploy.

---

## **🧪 VERIFY THE FIX**

After backend deployment:

1. **Visit**: https://luxury-begonia-e85c75.netlify.app
2. **Open**: Browser Dev Tools (F12)
3. **Try**: Google OAuth login
4. **Check console**: Should see successful API calls
5. **Test**: Calendar loading without CORS errors

### **Expected Results:**
- ✅ No CORS errors in console
- ✅ "Failed to fetch calendars" error resolved
- ✅ Google OAuth login works
- ✅ Calendar selection and events load properly

---

## **📱 ADDITIONAL TESTING**

### **Test API Endpoints Directly:**

```bash
# Test CORS preflight
curl -X OPTIONS https://calert-360373462324.us-west1.run.app/api/calendars \
  -H "Origin: https://luxury-begonia-e85c75.netlify.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -v

# Should return 200 with proper CORS headers
```

### **Browser Console Test:**
```javascript
// Test CORS from your Netlify app console
fetch('https://calert-360373462324.us-west1.run.app/api/calendars', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test'
  }
})
.then(r => console.log('CORS working!', r.status))
.catch(e => console.log('CORS error:', e));
```

---

## **🎯 DEPLOYMENT CHECKLIST**

- [ ] Backend deployed to Google Cloud Run with CORS fixes
- [ ] Environment variables set (`API_KEY`, `APP_TOKEN`)
- [ ] Frontend redeployed to Netlify (with UI fixes)
- [ ] CORS errors resolved in browser console
- [ ] Google OAuth login functional
- [ ] Calendar API calls successful
- [ ] Chrome extension tested

---

## **⚠️ IMPORTANT**

**Backend deployment is REQUIRED** - the CORS configuration changes need to be deployed to the live server at `https://calert-360373462324.us-west1.run.app` for your Netlify frontend to work.

**Once deployed, your Calert app will be fully functional!** 🎉