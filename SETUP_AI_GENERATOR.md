# 🚀 AI Test Case Generator - Setup Guide

## Quick Setup (2 minutes)

### 1. Add Environment Variable
Create or update your `.env.local` file in the project root:

```bash
# Add this line to your .env.local file
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Restart Your Development Server
```bash
# Stop your current server (Ctrl+C) and restart
npm run dev
```

### 3. That's It! 🎉
The AI Test Case Generator is now ready to use!

## 🎯 How to Use

1. **Open your QA application**
2. **Look in the sidebar** for the "AI Test Case Generator" section (blue gradient with lightning icon)
3. **Click to expand** the AI Test Case Generator accordion
4. **Click "Generate Test Cases from PRD"**
5. **Paste your PRD/documentation**
6. **Click "Generate Test Cases"**
7. **Review and select test cases**
8. **Click "Add Selected" to import**

## 📋 Example PRD to Test

Try this sample PRD to test the feature:

**Title:** User Login System

**Content:**
```
The application should allow users to log in using email and password.

Requirements:
1. Users can enter email and password
2. System validates credentials against database
3. Successful login redirects to dashboard
4. Failed login shows error message
5. Password field should be masked
6. Remember me functionality
7. Forgot password link
8. Account lockout after 3 failed attempts
9. Session timeout after 30 minutes
10. Secure password requirements (8+ chars, special chars)

User Stories:
- As a user, I want to log in so I can access my account
- As a user, I want to be remembered so I don't have to log in repeatedly
- As a user, I want to reset my password if I forget it
- As a user, I want to be protected from unauthorized access
```

## 🔧 Troubleshooting

### If you get "Gemini API key not configured":
1. Check that `.env.local` file exists
2. Verify the API key is correct
3. Restart your development server

### If generation fails:
1. Check your internet connection
2. Verify the PRD content is not empty
3. Try with a shorter PRD first

### If no test cases are generated:
1. Make sure your PRD has enough detail
2. Include specific requirements and user stories
3. Try the example PRD above

## 🎉 Ready to Transform Your QA Workflow!

The AI Test Case Generator will save you hours of manual test case creation while ensuring comprehensive coverage of your features.

---

*Need help? Check the full guide in `AI_TEST_CASE_GENERATOR_GUIDE.md`* 