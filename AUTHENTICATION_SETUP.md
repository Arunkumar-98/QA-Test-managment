# Authentication Setup Guide

This guide will help you set up user authentication for your QA Management application so you can share it with your team.

## 🚀 Quick Start

### 1. Database Setup

Run the following SQL commands in your Supabase SQL Editor to enable authentication:

```sql
-- Copy and paste the contents of supabase-auth-schema.sql
```

This will:
- Enable Row Level Security (RLS) on all tables
- Add `user_id` columns to all tables
- Create RLS policies to ensure users can only access their own data
- Set up automatic triggers to assign user IDs on data creation

### 2. Supabase Authentication Settings

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Settings**
3. Configure the following:

#### Email Templates
- **Confirm signup**: Customize the email template for account verification
- **Reset password**: Customize the password reset email template

#### Auth Settings
- **Enable email confirmations**: Turn this ON for production
- **Enable phone confirmations**: Turn OFF (not used in this app)
- **JWT expiry**: Set to 3600 (1 hour) or your preference

#### Site URL
- Set your deployment URL (e.g., `https://your-app.vercel.app`)

### 3. Environment Variables

Make sure your environment variables are set correctly:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔐 Authentication Features

### User Registration
- Email and password signup
- Full name collection
- Email verification (optional)
- Password strength validation

### User Login
- Email and password authentication
- Remember me functionality
- Secure session management

### User Management
- User profile display
- Secure logout
- Session persistence

### Data Isolation
- Each user can only see their own data
- Automatic user ID assignment
- Row Level Security (RLS) policies

## 👥 Team Sharing

### Inviting Team Members

1. **Share the application URL** with your team members
2. **They can sign up** using their email addresses
3. **Each user gets their own workspace** with isolated data
4. **No manual user management required** - Supabase handles everything

### User Experience

- **First-time users**: Will see the signup form
- **Returning users**: Will see the login form
- **Authenticated users**: Will see the main application
- **Loading states**: Smooth transitions between auth states

## 🛡️ Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Automatic user ID assignment on data creation
- Secure database policies

### Authentication Flow
- Secure token-based authentication
- Automatic session management
- Protected routes and components

### Data Protection
- User data isolation
- Secure API endpoints
- Input validation and sanitization

## 🔧 Customization

### Styling
The authentication pages use the same design system as your main application:
- Consistent color scheme
- Professional UI components
- Responsive design

### Email Templates
Customize email templates in Supabase Dashboard:
- Account confirmation emails
- Password reset emails
- Brand your emails with your company logo

### User Metadata
Users can have additional metadata:
- Full name
- Profile picture (future enhancement)
- Role/permissions (future enhancement)

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid login credentials"**
   - Check if the user exists
   - Verify email verification is complete
   - Reset password if needed

2. **"Email not confirmed"**
   - Check spam folder
   - Resend confirmation email
   - Verify email address is correct

3. **"Database permission denied"**
   - Ensure RLS policies are created
   - Check user authentication status
   - Verify database schema is updated

### Debug Mode

To enable debug logging, add this to your environment:

```env
NEXT_PUBLIC_DEBUG_AUTH=true
```

## 📱 Mobile Support

The authentication system is fully responsive:
- Works on all device sizes
- Touch-friendly interface
- Mobile-optimized forms

## 🔄 Future Enhancements

Potential features to add:
- Social login (Google, GitHub)
- Two-factor authentication
- Team collaboration features
- User roles and permissions
- Profile management
- Password strength indicators

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify your Supabase configuration
3. Ensure all SQL migrations are applied
4. Check your environment variables

---

**Note**: This authentication system uses Supabase Auth, which is production-ready and handles all the complex security requirements automatically. 