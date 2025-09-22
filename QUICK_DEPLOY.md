# 🚀 **INSTANT DEPLOYMENT GUIDE**

## **Fastest Way to Get Calert Live**

### **Option A: Deploy Frontend Only (Static Hosting)**

The easiest way to get started is to deploy just the frontend and use the existing backend URL.

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Surge.sh (Instant & Free):**
   ```bash
   npm install -g surge
   cd dist
   surge
   ```
   - Enter a domain name (e.g., `calert-demo.surge.sh`)
   - Your app will be live instantly!

3. **Alternative - Deploy to Netlify Drop:**
   - Go to https://app.netlify.com/drop
   - Drag your `dist/` folder
   - Get instant URL

### **Option B: Use GitHub Pages**

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/calert-v2.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repo → Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / docs (or gh-pages)

### **Option C: Use Vercel via Web Interface**

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Go to https://vercel.com/new**
   - Import your GitHub repo OR drag the `dist/` folder
   - Set environment variables:
     - `GEMINI_API_KEY=AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg`

---

## **Backend Status**

The backend appears to already be configured for:
`https://calert-360373462324.us-west1.run.app`

If this URL is working, you can use it directly. If not, you'll need to deploy the backend separately.

---

## **Quick Test Commands**

After building (`npm run build`), you can test locally:

```bash
# Test the built app locally
npx serve dist -p 3000

# Test if the configured backend is working
curl https://calert-360373462324.us-west1.run.app/api/calendars
```

---

## **Chrome Extension Installation**

After building:
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select your `dist/` folder
5. Test the extension!

---

## **Next Steps After Deployment**

1. **Update OAuth URLs** in Google Cloud Console
2. **Test the full flow** (login → calendar → notifications)
3. **Monitor usage** and logs

The fastest path is **Option A with Surge.sh** - it takes less than 2 minutes!