# Test Suite Sharing Guide

## 🚀 Overview

The QA Management application now supports **test suite sharing** - a powerful feature that allows you to share individual test suites with developers and team members via secure links. This provides more granular control than project sharing, allowing you to share specific test suites within a project.

## ✨ Key Features

### **🔗 Shareable Test Suite Links**
- Generate unique, secure links for each test suite
- No account required for shared users
- Direct access to specific test suite data
- Shows test suite statistics and information

### **🔐 Granular Permissions**
- **View Only**: Can only view test cases in the suite
- **Can Comment**: Can view and add comments to test cases
- **Can Edit**: Can view, comment, and edit test cases
- **Full Access**: Can perform all actions except delete

### **⚙️ Advanced Options**
- **Expiration Dates**: Set when the share link expires
- **View Limits**: Limit the number of times the link can be accessed
- **Email Restrictions**: Restrict access to specific email addresses
- **Usage Tracking**: Monitor how many times the link has been accessed

## 🎯 Use Cases

### **1. Feature-Specific Testing**
- Share test suites for specific features with developers
- Allow developers to review and update test cases
- Keep feature testing isolated and focused

### **2. Regression Testing**
- Share regression test suites with QA teams
- Allow external teams to run specific test scenarios
- Maintain test suite integrity with controlled access

### **3. Client Testing**
- Share specific test suites with clients for review
- Allow clients to see test coverage for their features
- Professional presentation of test results

### **4. Team Collaboration**
- Share test suites with different team members
- Allow specialists to focus on specific areas
- Controlled collaboration without full project access

## 🛠️ How to Use

### **Creating a Test Suite Share Link**

1. **Open the Test Suite**
   - Navigate to the test suite in the sidebar
   - Click the share button (📤) next to the test suite name

2. **Configure Permissions**
   - Select from predefined permission presets:
     - **View Only**: Basic read access
     - **Can Comment**: Add comments and feedback
     - **Can Edit**: Modify test cases
     - **Full Access**: Create, edit, and export (no delete)
   - Or customize individual permissions

3. **Set Advanced Options** (Optional)
   - **Expiration Date**: When the link expires
   - **Max Views**: Maximum number of times the link can be accessed
   - **Allowed Emails**: Restrict access to specific email addresses

4. **Generate Link**
   - Click "Create Share Link"
   - Copy the generated URL
   - Share with your team members

### **Accessing a Shared Test Suite**

1. **Open the Share Link**
   - Click the shared link in your browser
   - No login required for basic access

2. **View Test Suite Information**
   - See test suite details and statistics
   - View available permissions
   - Understand what actions you can perform

3. **Use the Test Suite**
   - Navigate test cases based on your permissions
   - Add comments, edit cases, or create new ones (if allowed)
   - View test suite statistics and progress

## 🔒 Security Features

### **Access Control**
- **Token-based Authentication**: Each share has a unique token
- **Permission Validation**: Server-side permission checking
- **Expiration Handling**: Automatic link deactivation
- **View Tracking**: Monitor link usage

### **Data Protection**
- **Test Suite Isolation**: Users only see the shared test suite
- **Project Context**: Shows project information for context
- **No Cross-Suite Access**: Cannot access other test suites
- **Audit Trail**: Track who accessed what and when

### **Privacy Controls**
- **Email Restrictions**: Limit access to specific users
- **View Limits**: Prevent unlimited access
- **Time Limits**: Automatic expiration
- **Revocation**: Deactivate shares at any time

## 📊 Permission Levels

### **View Only** 👁️
```
✅ View test cases in suite
✅ View comments
❌ Add comments
❌ Edit test cases
❌ Create test cases
❌ Delete test cases
❌ Export data
```
**Best for**: Stakeholders, clients, read-only access

### **Can Comment** 💬
```
✅ View test cases in suite
✅ View comments
✅ Add comments
❌ Edit test cases
❌ Create test cases
❌ Delete test cases
❌ Export data
```
**Best for**: Reviewers, feedback providers

### **Can Edit** ✏️
```
✅ View test cases in suite
✅ View comments
✅ Add comments
✅ Edit test cases
❌ Create test cases
❌ Delete test cases
❌ Export data
```
**Best for**: Developers, testers, collaborators

### **Full Access** 🚀
```
✅ View test cases in suite
✅ View comments
✅ Add comments
✅ Edit test cases
✅ Create test cases
❌ Delete test cases
✅ Export data
```
**Best for**: Team leads, senior developers

## 🗄️ Database Setup

### **1. Run the Schema**
Execute the SQL commands in `test-suite-sharing-schema.sql` in your Supabase SQL Editor:

```sql
-- This creates the test_suite_shares table and related functions
-- Copy and paste the contents of test-suite-sharing-schema.sql
```

### **2. Verify Setup**
Check that the following are created:
- ✅ `test_suite_shares` table
- ✅ RLS policies
- ✅ Access validation functions
- ✅ View tracking triggers

## 📱 User Experience

### **For Test Suite Owners**
- **Easy Sharing**: One-click share link generation from sidebar
- **Permission Control**: Granular access management
- **Usage Monitoring**: Track link usage and access
- **Link Management**: View, edit, and revoke shares

### **For Shared Users**
- **No Registration**: Direct access via link
- **Clear Permissions**: Visible permission indicators
- **Test Suite Context**: Shows suite information and statistics
- **Access Feedback**: Clear error messages for denied actions

## 🔧 Technical Implementation

### **Frontend Components**
- `ShareTestSuiteDialog`: Share link creation interface
- `SharedTestSuitePage`: Dedicated page for shared access
- Permission-aware UI components
- Access validation and error handling

### **Backend Services**
- `testSuiteShareService`: Share management functions
- Database schema with RLS policies
- Token validation and access control

### **Database Schema**
- `test_suite_shares` table with all necessary fields
- RLS policies for security
- Triggers for view counting
- Functions for access validation

## 🚀 Getting Started

### **1. Set Up Database**
```sql
-- Run the schema in Supabase SQL Editor
-- Copy contents of test-suite-sharing-schema.sql
```

### **2. Test the Feature**
1. Create a test suite in your project
2. Click the share button in the sidebar
3. Configure permissions and options
4. Generate and test the share link

### **3. Share with Team**
- Send the generated link to team members
- Monitor usage and access
- Adjust permissions as needed

## 📞 Support

If you encounter any issues:

1. **Check Database Setup**: Ensure all tables and policies are created
2. **Verify Permissions**: Check RLS policies are active
3. **Test Access**: Try accessing the share link in incognito mode
4. **Check Logs**: Review Supabase logs for errors

---

**Ready to share test suites!** The functionality is now available in your QA Management application. 