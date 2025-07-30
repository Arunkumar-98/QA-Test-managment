# QA Management System - Deployment Guide

## 🚀 Deployment to Vercel

### Prerequisites
- Vercel account
- Supabase project
- Google Gemini API key

### Environment Variables

Set these environment variables in your Vercel project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Admin Configuration (optional)
ADMIN_EMAILS=admin@example.com,admin2@example.com

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### Security Features

✅ **API Protection**: All API routes are protected with authentication
✅ **Security Headers**: CSP, X-Frame-Options, and other security headers
✅ **Rate Limiting**: Built-in rate limiting for AI endpoints
✅ **Admin Access**: Database fix endpoint restricted to admin users
✅ **Environment Variables**: Sensitive data stored in environment variables

### Public API Routes

Only these API routes are publicly accessible:
- `/api/check-env` - Environment checking
- `/api/debug-env` - Debug information

All other API routes require authentication.

### Database Setup

1. Run the SQL scripts in your Supabase SQL editor:
   - `supabase-schema.sql`
   - `supabase-auth-schema.sql`
   - `status-history-schema.sql`

2. Apply the RLS fix if needed:
   - Run `fix-status-history-rls.sql`

### Build Configuration

The app is configured for production builds with:
- TypeScript compilation
- Security headers
- API route protection
- Environment variable validation

### Monitoring

- API requests are logged with user email and IP
- Error handling with proper status codes
- Authentication failures are logged

## 🔒 Security Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase RLS policies configured
- [ ] Admin emails configured
- [ ] Gemini API key secured
- [ ] Database schema applied
- [ ] Security headers enabled
- [ ] API authentication working

## 🚨 Important Notes

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Enable RLS** in Supabase for data protection
4. **Monitor API usage** for rate limiting
5. **Regular security updates** for dependencies

## 📞 Support

For deployment issues, check:
1. Environment variables are correctly set
2. Supabase connection is working
3. Database schema is applied
4. API keys are valid 