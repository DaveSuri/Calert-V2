# 🚀 Calert Deployment Guide

## Quick Deployment Instructions

### Prerequisites
- Google Cloud SDK installed (`gcloud` command)
- Vercel CLI installed (`npx vercel` or `npm install -g vercel`)
- Docker installed (for Google Cloud Run)

---

## Option 1: Deploy Backend to Google Cloud Run (RECOMMENDED)

1. **Login to Google Cloud:**
   ```bash
   gcloud auth login
   gcloud config set project calert-h175v
   ```

2. **Deploy backend:**
   ```bash
   ./deploy-backend.sh
   ```
   
   OR manually:
   ```bash
   gcloud run deploy calert-backend \
     --source . \
     --platform managed \
     --region us-west1 \
     --allow-unauthenticated \
     --set-env-vars="API_KEY=AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg,APP_TOKEN=calert-secure-token-2024"
   ```

3. **Note the backend URL** (will be something like: `https://calert-backend-calert-h175v.us-west1.run.app`)

---

## Option 2: Deploy Frontend to Vercel

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   npx vercel --prod
   ```
   
   When prompted:
   - Set up and deploy? **Y**
   - Which scope? **Your account**
   - Link to existing project? **N** 
   - Project name: **calert-app**
   - Directory: **./dist**

3. **Set environment variables on Vercel:**
   ```bash
   npx vercel env add GEMINI_API_KEY
   ```
   Enter: `AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg`

---

## Option 3: Alternative - Deploy to Netlify

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify (drag & drop):**
   - Go to https://app.netlify.com/drop
   - Drag the `dist/` folder
   - Set environment variables in Netlify dashboard

---

## Option 4: Use GitHub Pages (Free)

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json:**
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Build and deploy:**
   ```bash
   npm run build
   npm run deploy
   ```

---

## Testing the Deployment

### Test Web Application
1. Visit your deployed frontend URL
2. Click "Connect with Google Calendar"
3. Authorize the application
4. Select a calendar and test event loading

### Test Chrome Extension
1. Build: `npm run build`
2. Open Chrome → Extensions → Developer mode
3. Load unpacked → Select `dist/` folder
4. Test notifications

---

## Environment Variables Needed

### Backend (Google Cloud Run):
- `API_KEY=AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg`
- `APP_TOKEN=calert-secure-token-2024`

### Frontend (Vercel/Netlify):
- `GEMINI_API_KEY=AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg`

---

## OAuth Setup Checklist

### Google Cloud Console:
1. **Web Application** OAuth Client:
   - Client ID: `360373462324-nr5vpdjfd1g5i38j5h5c6l3g74d0lqd9.apps.googleusercontent.com`
   - Authorized origins: Add your deployed frontend URL

2. **Chrome Extension** OAuth Client:
   - Client ID: `360373462324-0fjqvtd35esaqi5v8ioschmbhshj0l4l.apps.googleusercontent.com`
   - Already configured for chrome-extension://

### Firebase Project:
- Project ID: `calert-h175v` ✅ Already configured

---

## Troubleshooting

### Common Issues:
1. **CORS errors**: Add your frontend URL to backend CORS config
2. **OAuth errors**: Add deployed URL to Google Cloud Console
3. **Environment variables**: Make sure all keys are set correctly

### Support:
- Check logs: `gcloud logs read --service calert-backend`
- Vercel logs: Visit Vercel dashboard
- Chrome extension: Check extension popup for errors