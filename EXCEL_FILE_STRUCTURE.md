# 📊 **Excel File Structure - Visual Guide**

## 🎯 **Your Excel File Should Look Like This:**

### **📋 Row 1: Headers (Column Names)**
```
A    B          C                    D                    E       F           G       H                    I              J                    K                    L       M                    N       O                    P       Q        R                    S                    T                U              V       W           X                    Y       Z           AA      AB      AC      AD      AE      AF              AG              AH              AI              AJ          AK              AL              AM                    AN
#    Test Case  Description          Expected Result      Status  Priority    Category Assigned Tester    Execution Date Notes                Actual Result        Environment Prerequisites      Platform Steps to Reproduce Test Suite Position Created At        Updated At        Automation Script Custom Fields QA Status Dev Status Assigned Developer Bug Status Test Type Test Level Defect Severity Defect Priority Estimated Time Actual Time Test Data        Attachments      Tags            Reviewer        Review Date    Review Notes    Last Modified By Last Modified Date Actions
```

### **📋 Row 2: Sample Test Case 1**
```
1    TC001      Verify user login    User should login    Pass    P1 (High)   UI/UX   john.doe@example.com 2024-01-15     Test completed       Login successful     Web       Valid user account   Web      1. Go to login page    Smoke     1        2024-01-15 10:30:00 2024-01-15 14:45:00 Yes              Approved    Closed    dev@example.com     Closed    Functional System    Major      P2        30           25           Test credentials   screenshot.png   UI,Login    reviewer@example.com 2024-01-16  Approved for release user@example.com 2024-01-16 09:15:00 Close
```

### **📋 Row 3: Sample Test Case 2**
```
2    TC002      Verify user logout   User should logout   Pass    P2 (Medium) UI/UX   jane.smith@example.com 2024-01-15   Test passed          Logout successful    Web       User logged in       Web      1. Click logout       Smoke     2        2024-01-15 11:00:00 2024-01-15 15:00:00 No               Approved    Closed    dev@example.com     Closed    Functional System    Minor      P3        15           12           N/A              N/A           UI,Session  reviewer@example.com 2024-01-16  Test passed          user@example.com 2024-01-16 10:00:00 Close
```

---

## 🎯 **Key Points for Your Excel File:**

### **✅ Required Columns (Minimum):**
- **Test Case** (Column B) - Unique identifier like "TC001", "TC002"
- **Description** (Column C) - What you're testing
- **Expected Result** (Column D) - What should happen
- **Status** (Column E) - Use exact values: `Pass`, `Fail`, `Blocked`, `In Progress`, `Not Executed`, `Other`

### **✅ Important Dropdown Values:**
- **Status**: `Pass`, `Fail`, `Blocked`, `In Progress`, `Not Executed`, `Other`
- **Priority**: `P0 (Blocker)`, `P1 (High)`, `P2 (Medium)`, `P3 (Low)`, `Other`
- **Category**: `Recording`, `Transcription`, `Notifications`, `Calling`, `UI/UX`, `Other`
- **Environment**: `Android`, `iOS`, `Web`, `Backend`, `Other`
- **Platform**: `Android`, `iOS`, `Web`, `Cross-platform`, `Other`

### **✅ Multi-line Text Handling:**
For "Steps to Reproduce" and other long text fields, use:
- **Line breaks**: Use `\n` for new lines
- **Example**: `1. Go to login page\n2. Enter username\n3. Enter password\n4. Click login`

---

## 🚀 **How to Create Your Excel File:**

### **Step 1: Open Excel/Google Sheets**
1. Create a new spreadsheet
2. In Row 1, add the column headers (exact names from the table above)
3. Start adding your test cases from Row 2

### **Step 2: Add Your Test Cases**
```
Row 2: TC001 | Your test description | Expected result | Pass | P1 (High) | UI/UX | ...
Row 3: TC002 | Another test description | Expected result | Fail | P2 (Medium) | UI/UX | ...
Row 4: TC003 | Third test description | Expected result | Not Executed | P3 (Low) | UI/UX | ...
```

### **Step 3: Save and Import**
1. Save as `.xlsx` format
2. Go to your QA Management app
3. Click "Import" button
4. Upload your Excel file
5. Review the preview
6. Click "Import"

---

## 📊 **Sample Data Examples:**

### **Authentication Tests:**
```
TC001 | Verify user login with valid credentials | User should be successfully logged in | Pass | P1 (High) | UI/UX
TC002 | Verify user login with invalid password | Error message should display | Fail | P2 (Medium) | UI/UX
TC003 | Verify password reset functionality | Password reset email should be sent | Not Executed | P2 (Medium) | Notifications
```

### **E-commerce Tests:**
```
TC004 | Verify shopping cart add item | Product should be added to cart | Pass | P1 (High) | UI/UX
TC005 | Verify checkout process | Order should be processed successfully | Not Executed | P1 (High) | UI/UX
TC006 | Verify payment processing | Payment should be processed | Not Executed | P0 (Blocker) | UI/UX
```

### **API Tests:**
```
TC007 | Verify API response time | API should respond within 2 seconds | Pass | P2 (Medium) | Other
TC008 | Verify API authentication | API should require valid token | Not Executed | P1 (High) | Other
TC009 | Verify API error handling | API should return proper error codes | Not Executed | P2 (Medium) | Other
```

---

## 🎯 **Import Process Flow:**

### **1. File Upload**
- Select your `.xlsx` file
- System detects Excel format
- Shows file size and row count

### **2. Field Mapping**
- System automatically maps your column headers
- Shows which fields are mapped correctly
- Highlights any unmapped columns

### **3. Data Preview**
- Shows first 10 rows of your data
- Displays how data will look after import
- Shows any validation issues

### **4. Validation Results**
- ✅ Valid data (green checkmarks)
- ⚠️ Warnings (yellow exclamation marks)
- ❌ Errors (red X marks)

### **5. Import Execution**
- Processes your data in chunks
- Shows progress bar
- Displays import results

### **6. Import Summary**
- Total records processed
- Successfully imported count
- Failed imports count
- Any errors or warnings

---

## 🚨 **Common Issues & Solutions:**

### **Issue: "Invalid Status Value"**
**Your Excel has**: `Pending`, `High`, `Medium`, `Low`
**Should be**: `Not Executed`, `P1 (High)`, `P2 (Medium)`, `P3 (Low)`

### **Issue: "Column Not Mapped"**
**Your Excel has**: `Test Case ID`, `Test Description`
**Should be**: `Test Case`, `Description`

### **Issue: "Duplicate Test Cases"**
**Your Excel has**: Multiple rows with same test case name
**Solution**: Make each test case name unique (TC001, TC002, TC003, etc.)

---

## 🎉 **Ready to Import!**

Your Excel file should now be properly formatted and ready for import. The system will handle all the complex mapping and validation automatically!

**Next Steps:**
1. ✅ Create your Excel file with the correct format
2. ✅ Use the exact dropdown values provided
3. ✅ Save as `.xlsx` format
4. ✅ Upload to your QA Management app
5. ✅ Review the import preview
6. ✅ Click "Import" to complete

**Your test cases will be imported with all the correct field mappings and validation!** 🚀
