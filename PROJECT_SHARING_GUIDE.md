# Project Sharing Guide

## 🚀 Overview

The QA Management application now supports **project sharing** - a powerful feature that allows you to share specific projects with developers and team members via secure links. Each shared project has customizable permissions, ensuring that users can only perform actions you've authorized.

## ✨ Key Features

### **🔗 Shareable Links**
- Generate unique, secure links for each project
- No account required for shared users
- Direct access to specific project data

### **🔐 Granular Permissions**
- **View Only**: Can only view test cases and comments
- **Can Comment**: Can view and add comments to test cases
- **Can Edit**: Can view, comment, and edit test cases
- **Full Access**: Can perform all actions except delete

### **⚙️ Advanced Options**
- **Expiration Dates**: Set when the share link expires
- **View Limits**: Limit the number of times the link can be accessed
- **Email Restrictions**: Restrict access to specific email addresses
- **Usage Tracking**: Monitor how many times the link has been accessed

## 🎯 Use Cases

### **1. Developer Collaboration**
- Share test cases with developers for review
- Allow developers to add comments and update status
- Keep developers informed without giving full access

### **2. Client/Stakeholder Review**
- Share projects with clients for approval
- View-only access for stakeholders
- Professional presentation of test results

### **3. Team Onboarding**
- Share projects with new team members
- Controlled access during training
- Gradual permission escalation

### **4. External Testing**
- Share with external QA teams
- Limited access for contractors
- Secure collaboration with partners

## 🛠️ How to Use

### **Creating a Share Link**

1. **Open the Share Dialog**
   - Click the "Share Project" button in the header
   - Or use the project settings menu

2. **Choose Permissions**
   - Select from predefined permission presets
   - Or customize individual permissions:
     - ✅ View Test Cases
     - 💬 Add Comments
     - ✏️ Edit Test Cases
     - ➕ Create Test Cases
     - 📊 Export Data

3. **Set Advanced Options** (Optional)
   - **Expiration Date**: When the link expires
   - **Max Views**: Maximum number of times the link can be accessed
   - **Allowed Emails**: Restrict access to specific email addresses

4. **Generate Link**
   - Click "Create Share Link"
   - Copy the generated URL
   - Share with your team members

### **Accessing a Shared Project**

1. **Open the Share Link**
   - Click the shared link in your browser
   - No login required

2. **View Permissions**
   - See your available permissions at the top
   - Understand what actions you can perform

3. **Use the Application**
   - Navigate test cases based on your permissions
   - Add comments, edit cases, or create new ones (if allowed)

## 🔒 Security Features

### **Access Control**
- **Token-based Authentication**: Each share has a unique token
- **Permission Validation**: Server-side permission checking
- **Expiration Handling**: Automatic link deactivation
- **View Tracking**: Monitor link usage

### **Data Protection**
- **Project Isolation**: Users only see the shared project
- **No Cross-Project Access**: Cannot access other projects
- **Audit Trail**: Track who accessed what and when
- **Secure Tokens**: Cryptographically secure access tokens

### **Privacy Controls**
- **Email Restrictions**: Limit access to specific users
- **View Limits**: Prevent unlimited access
- **Time Limits**: Automatic expiration
- **Revocation**: Deactivate shares at any time

## 📊 Permission Levels

### **View Only** 👁️
```
✅ View test cases
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
✅ View test cases
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
✅ View test cases
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
✅ View test cases
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
Execute the SQL commands in `project-sharing-schema.sql` in your Supabase SQL Editor:

```sql
-- This creates the project_shares table and related functions
-- Copy and paste the contents of project-sharing-schema.sql
```

### **2. Verify Setup**
Check that the following are created:
- ✅ `project_shares` table
- ✅ RLS policies
- ✅ Access validation functions
- ✅ View tracking triggers

## 📱 User Experience

### **For Project Owners**
- **Easy Sharing**: One-click share link generation
- **Permission Control**: Granular access management
- **Usage Monitoring**: Track link usage and access
- **Link Management**: View, edit, and revoke shares

### **For Shared Users**
- **No Registration**: Direct access via link
- **Clear Permissions**: Visible permission indicators
- **Intuitive Interface**: Same familiar QA interface
- **Access Feedback**: Clear error messages for denied actions

## 🔧 Technical Implementation

### **Frontend Components**
- `ShareProjectDialog`: Share link creation interface
- `SharedProjectPage`: Dedicated page for shared access
- Permission-aware UI components
- Access validation and error handling

### **Backend Services**
- `projectShareService`: Share management functions
- Database schema with RLS policies
- Token validation and access control
- Usage tracking and analytics

### **Security Measures**
- Row Level Security (RLS) policies
- Token-based authentication
- Permission validation on every request
- Automatic access expiration

## 🚨 Troubleshooting

### **Common Issues**

1. **"Share link is invalid"**
   - Check if the link was copied correctly
   - Verify the share hasn't been deleted
   - Ensure the share is still active

2. **"Access denied"**
   - Check your permissions for the shared project
   - Verify email restrictions (if any)
   - Contact the project owner for access

3. **"Link has expired"**
   - The share link has reached its expiration date
   - Request a new link from the project owner

4. **"Maximum views reached"**
   - The share link has been accessed the maximum number of times
   - Request a new link or increased view limit

### **For Project Owners**

1. **Manage Active Shares**
   - View all active shares in project settings
   - Monitor usage statistics
   - Revoke or modify shares as needed

2. **Security Best Practices**
   - Set appropriate expiration dates
   - Use email restrictions for sensitive projects
   - Monitor share usage regularly
   - Revoke unused shares

## 📈 Future Enhancements

### **Planned Features**
- **Share Analytics**: Detailed usage reports
- **Bulk Sharing**: Share multiple projects at once
- **Temporary Access**: Time-limited access codes
- **Integration**: Slack, email integration
- **Advanced Permissions**: Role-based access control

### **API Access**
- REST API for programmatic sharing
- Webhook notifications for share events
- Third-party integrations

---

## 🎉 Getting Started

1. **Set up the database schema** using `project-sharing-schema.sql`
2. **Create your first share** by clicking "Share Project"
3. **Test the shared link** in an incognito window
4. **Share with your team** and start collaborating!

The project sharing feature is now ready to enhance your QA workflow and improve team collaboration! 🚀 