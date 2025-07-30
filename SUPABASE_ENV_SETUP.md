# 🔐 Supabase Environment Variables Setup

## 🚨 **Current Status**
Your Supabase connection is currently **hardcoded** in `lib/supabase.ts`. While it works, it's not the best practice for security and flexibility.

## 🛠️ **Recommended Setup**

### **Step 1: Update lib/supabase.ts**

Replace the hardcoded values with environment variables:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tbutffculjesqiodwxsh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzczNjMsImV4cCI6MjA2ODk1MzM2M30.pbvISdr311KMo7Ia_T3GyDRDCnPBELIWBLw3PkpBSjM'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### **Step 2: Create .env.local (Local Development)**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tbutffculjesqiodwxsh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzczNjMsImV4cCI6MjA2ODk1MzM2M30.pbvISdr311KMo7Ia_T3GyDRDCnPBELIWBLw3PkpBSjM

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Gemini API Configuration
GEMINI_API_KEY=AIzaSyBRd6A5zvNlo7b92_sZSTnZJB68Y6-YK2M
```

### **Step 3: Add to Live Deployment**

#### **For Vercel:**
1. Go to **Settings** → **Environment Variables**
2. Add:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://tbutffculjesqiodwxsh.supabase.co`
   - **Environment**: Production ✅, Preview ✅, Development ✅

   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzczNjMsImV4cCI6MjA2ODk1MzM2M30.pbvISdr311KMo7Ia_T3GyDRDCnPBELIWBLw3PkpBSjM`
   - **Environment**: Production ✅, Preview ✅, Development ✅

3. Click **Save**
4. **Redeploy** your application

#### **For Other Platforms:**
Follow the same pattern as Gemini API setup in `GEMINI_API_SETUP.md`

## 🔍 **Do You Need Service Role Key?**

### **Current Usage Check:**
Your app currently uses the **anon key** for all operations, which is fine for most use cases.

### **When You Need Service Role Key:**
- **Admin operations** (bypassing RLS)
- **Database migrations**
- **Bulk operations**
- **System-level tasks**

### **For Now:**
You can **skip** the service role key unless you need admin operations.

## 📋 **Complete Environment Variables List**

```bash
# Required for database
NEXT_PUBLIC_SUPABASE_URL=https://tbutffculjesqiodwxsh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzczNjMsImV4cCI6MjA2ODk1MzM2M30.pbvISdr311KMo7Ia_T3GyDRDCnPBELIWBLw3PkpBSjM

# Optional for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Required for AI features
GEMINI_API_KEY=AIzaSyBRd6A5zvNlo7b92_sZSTnZJB68Y6-YK2M
```

## 🎯 **Priority Order**

1. **First**: Add `GEMINI_API_KEY` (for AI features)
2. **Second**: Add Supabase env vars (for better security)
3. **Optional**: Add service role key (if needed later)

## ✅ **Benefits After Setup**

- **Better security** - keys not in code
- **Easy deployment** - different keys per environment
- **Team collaboration** - no shared keys in code
- **Key rotation** - easy to update without code changes
- **Professional setup** - follows best practices

## 🚀 **Quick Start**

**If you want to keep it simple for now:**
1. Just add `GEMINI_API_KEY` to your deployment
2. Your Supabase connection will continue working as-is
3. You can add Supabase env vars later when convenient

**Your app will work perfectly either way!** 🎉 