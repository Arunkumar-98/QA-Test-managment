# 🚀 Deployment Environment Variables Setup

## 📋 **Required Environment Variables**

Copy these exact values to your deployment platform:

```bash
# Required for AI features (UPDATE WITH YOUR NEW KEY)
GEMINI_API_KEY=your_new_gemini_api_key_here

# Required for database connection
NEXT_PUBLIC_SUPABASE_URL=https://tbutffculjesqiodwxsh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzczNjMsImV4cCI6MjA2ODk1MzM2M30.pbvISdr311KMo7Ia_T3GyDRDCnPBELIWBLw3PkpBSjM
```

## 🌐 **Deployment Platform Setup**

### **Vercel Deployment:**

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your QA Management project

2. **Add Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Click **Add New**
   - Add each variable:

   ```
   Name: GEMINI_API_KEY
   Value: your_new_gemini_api_key_here
   Environment: Production ✅, Preview ✅, Development ✅
   ```

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://tbutffculjesqiodwxsh.supabase.co
   Environment: Production ✅, Preview ✅, Development ✅
   ```

   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzczNjMsImV4cCI6MjA2ODk1MzM2M30.pbvISdr311KMo7Ia_T3GyDRDCnPBELIWBLw3PkpBSjM
   Environment: Production ✅, Preview ✅, Development ✅
   ```

3. **Redeploy**
   - Go to **Deployments** tab
   - Click **Redeploy** on your latest deployment

### **Netlify Deployment:**

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Select your QA Management site

2. **Add Environment Variables**
   - Go to **Site settings** → **Environment variables**
   - Click **Add variable**
   - Add each variable:

   ```
   Key: GEMINI_API_KEY
   Value: your_new_gemini_api_key_here
   Scope: All scopes
   ```

   ```
   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: https://tbutffculjesqiodwxsh.supabase.co
   Scope: All scopes
   ```

   ```
   Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzczNjMsImV4cCI6MjA2ODk1MzM2M30.pbvISdr311KMo7Ia_T3GyDRDCnPBELIWBLw3PkpBSjM
   Scope: All scopes
   ```

3. **Trigger New Deployment**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**

### **Railway Deployment:**

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Select your QA Management project

2. **Add Environment Variables**
   - Go to **Variables** tab
   - Click **New Variable**
   - Add each variable:

   ```
   GEMINI_API_KEY=your_new_gemini_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=https://tbutffculjesqiodwxsh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzczNjMsImV4cCI6MjA2ODk1MzM2M30.pbvISdr311KMo7Ia_T3GyDRDCnPBELIWBLw3PkpBSjM
   ```

3. **Redeploy**
   - Railway will automatically redeploy when variables are added

## 🔒 **Security Checklist**

### **Before Deployment:**
- [ ] Revoked the old Gemini API key
- [ ] Generated a new Gemini API key
- [ ] Updated local `.env.local` with new key
- [ ] Added all environment variables to deployment platform
- [ ] Tested locally with new configuration

### **After Deployment:**
- [ ] Verified AI features work on live site
- [ ] Verified database connection works
- [ ] Checked authentication functionality
- [ ] Tested import/export features

## 🚨 **Important Notes**

### **Gemini API Key:**
- **DO NOT** use the old key: `AIzaSyBRd6A5zvNlo7b92_sZSTnZJB68Y6-YK2M`
- **DO** generate a new key from Google AI Studio
- **DO** update both local and deployment environments

### **Supabase Keys:**
- These are **public keys** and safe to use
- The anon key is designed to be public
- No security risk from using these keys

## 🎯 **Verification Steps**

### **Test Your Live Deployment:**
1. **Visit your live site**
2. **Try the AI Test Case Generator** (should work with new key)
3. **Test authentication** (login/signup)
4. **Test database operations** (create test cases)
5. **Test import/export** functionality

### **If Something Doesn't Work:**
1. **Check environment variables** are correctly set
2. **Verify the new API key** is valid
3. **Check deployment logs** for errors
4. **Redeploy** if necessary

---

**Your application is now properly configured for secure deployment! 🚀** 