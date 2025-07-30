# 🔒 Security Guide - QA Management System

## 🚨 CRITICAL: API Keys and Secrets

### **Never Commit These to Git:**
- ❌ **API Keys** (Google Gemini, OpenAI, etc.)
- ❌ **Database Passwords**
- ❌ **JWT Secrets**
- ❌ **Private Keys**
- ❌ **Access Tokens**
- ❌ **Service Account Keys**

### **Safe to Commit:**
- ✅ **Public URLs** (Supabase project URL)
- ✅ **Public Anon Keys** (Supabase anon key - but better to use env vars)
- ✅ **Configuration files** (without secrets)
- ✅ **Documentation** (without real keys)

## 🛡️ Environment Variables Setup

### **Required Environment Variables:**
```bash
# .env.local (DO NOT COMMIT THIS FILE)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### **Optional Environment Variables:**
```bash
# For admin operations only
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🔍 Security Checklist

### **Before Committing:**
- [ ] No API keys in code
- [ ] No passwords in code
- [ ] No secrets in documentation
- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded credentials

### **Before Pushing to GitHub:**
- [ ] Run security scan: `npm audit`
- [ ] Check for exposed secrets
- [ ] Verify `.gitignore` is working
- [ ] Review all files being committed

## 🚨 Emergency: If You Accidentally Expose Secrets

### **Immediate Actions:**
1. **Revoke the exposed key immediately**
2. **Generate a new key**
3. **Update your environment variables**
4. **Remove the key from git history**

### **Remove from Git History:**
```bash
# Remove file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remove from remote
git push origin --force --all
```

## 🔧 Security Best Practices

### **1. Use Environment Variables**
```typescript
// ✅ Good
const apiKey = process.env.GEMINI_API_KEY

// ❌ Bad
const apiKey = 'AIzaSyBRd6A5zvNlo7b92_sZSTnZJB68Y6-YK2M'
```

### **2. Validate Environment Variables**
```typescript
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required')
}
```

### **3. Use .env.local for Development**
```bash
# .env.local (not committed)
GEMINI_API_KEY=your_actual_key_here
```

### **4. Use Deployment Environment Variables**
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Railway**: Variables tab

## 📋 Security Monitoring

### **Regular Checks:**
- [ ] Weekly: `npm audit`
- [ ] Monthly: Review environment variables
- [ ] Quarterly: Security dependency updates
- [ ] Before deployment: Secret scan

### **Tools to Use:**
- **GitGuardian**: Secret scanning
- **TruffleHog**: Find secrets in git
- **npm audit**: Dependency vulnerabilities
- **GitHub Security**: Built-in scanning

## 🎯 Current Security Status

### **✅ Secured:**
- API keys removed from documentation
- Environment variables properly configured
- `.env.local` in `.gitignore`
- Supabase keys using env vars

### **⚠️ Monitor:**
- Supabase anon key (public but should use env vars)
- Third-party dependencies
- Authentication tokens

## 🚀 Deployment Security

### **Production Checklist:**
- [ ] All secrets in environment variables
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

### **Environment Variables in Production:**
```bash
# Vercel/Netlify/Railway
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_key
```

## 📞 Emergency Contacts

If you discover a security issue:
1. **Immediately revoke exposed keys**
2. **Generate new keys**
3. **Update all environments**
4. **Notify team members**

---

**Remember: Security is everyone's responsibility! 🔒** 