# 📊 **Excel Import Format Guide**

## 🎯 **How Your Excel File Should Look**

### **📋 Required Column Headers (39 Fields)**

Your Excel file should have these exact column headers in the first row:

| Column | Header Name | Type | Example Values |
|--------|-------------|------|----------------|
| **A** | `#` | Number | 1, 2, 3, 4... |
| **B** | `Description` | Text | "Verify user login with valid credentials" |
| **C** | `Expected Result` | Text | "User should be successfully logged in" |
| **D** | `Status` | Dropdown | `Pass`, `Fail`, `Blocked`, `In Progress`, `Not Executed`, `Other` |
| **E** | `Priority` | Dropdown | `P0 (Blocker)`, `P1 (High)`, `P2 (Medium)`, `P3 (Low)`, `Other` |
| **F** | `Category` | Dropdown | `Recording`, `Transcription`, `Notifications`, `Calling`, `UI/UX`, `Other` |
| **G** | `Assigned Tester` | Text | john.doe@example.com |
| **H** | `Execution Date` | Date | 2024-01-15 |
| **I** | `Notes` | Text | "Test completed successfully" |
| **J** | `Actual Result` | Text | "Login successful, redirected to dashboard" |
| **K** | `Environment` | Dropdown | `Android`, `iOS`, `Web`, `Backend`, `Other` |
| **L** | `Prerequisites` | Text | "Valid user account exists" |
| **M** | `Platform` | Dropdown | `Android`, `iOS`, `Web`, `Cross-platform`, `Other` |
| **N** | `Steps to Reproduce` | Text | "1. Navigate to login page\n2. Enter username\n3. Enter password\n4. Click login" |
| **O** | `Test Suite` | Dropdown | `Smoke`, `Regression`, `Functional`, `Sanity`, `UAT`, `Other` |
| **P** | `Position` | Number | 1, 2, 3, 4... |
| **Q** | `Created At` | Date | 2024-01-15 10:30:00 |
| **R** | `Updated At` | Date | 2024-01-15 14:45:00 |
| **S** | `Automation Script` | Dropdown | `Yes`, `No`, `Planned`, `Other` |
| **T** | `Custom Fields` | Text | Project-specific data |
| **U** | `QA Status` | Dropdown | `New`, `Reviewed`, `Approved`, `Rejected`, `Other` |
| **V** | `Dev Status` | Dropdown | `Open`, `In Progress`, `Fixed`, `Reopened`, `Closed`, `Other` |
| **W** | `Assigned Developer` | Text | dev@example.com |
| **X** | `Bug Status` | Dropdown | `New`, `In Progress`, `Verified`, `Closed`, `Reopened`, `Deferred`, `Other` |
| **Y** | `Test Type` | Dropdown | `Functional`, `Regression`, `Smoke`, `Performance`, `Security`, `Other` |
| **Z** | `Test Level` | Dropdown | `Unit`, `Integration`, `System`, `UAT`, `Other` |
| **AA** | `Defect Severity` | Dropdown | `Critical`, `Major`, `Minor`, `Trivial`, `Other` |
| **AB** | `Defect Priority` | Dropdown | `P0`, `P1`, `P2`, `P3`, `Other` |
| **AC** | `Estimated Time` | Number | 30 (minutes) |
| **AD** | `Actual Time` | Number | 25 (minutes) |
| **AE** | `Test Data` | Text | "Test user credentials" |
| **AF** | `Attachments` | Text | "screenshot.png, log.txt" |
| **AG** | `Tags` | Text | "UI, API, Backend, Security, Performance" |
| **AH** | `Reviewer` | Text | reviewer@example.com |
| **AI** | `Review Date` | Date | 2024-01-16 |
| **AJ** | `Review Notes` | Text | "Approved for release" |
| **AK** | `Last Modified By` | Text | user@example.com |
| **AL** | `Last Modified Date` | Date | 2024-01-16 09:15:00 |
| **AM** | `Actions` | Dropdown | `Retest`, `Close`, `Assign`, `Escalate`, `Other` |

---

## 📊 **Sample Excel File Structure**

### **Row 1: Headers**
```
# | Description | Expected Result | Status | Priority | Category | Assigned Tester | ...
```

### **Row 2: Sample Data**
```
1 | Verify user login with valid credentials | User should be successfully logged in and redirected to dashboard | Pass | P1 (High) | UI/UX | john.doe@example.com | ...
```

### **Row 3: Sample Data**
```
2 | Verify user login with invalid password | Error message should display 'Invalid password' | Fail | P2 (Medium) | UI/UX | jane.smith@example.com | ...
```

---

## 🎯 **Dropdown Values (EXACT)**

### **Status Options:**
- `Pass`
- `Fail` 
- `Blocked`
- `In Progress`
- `Not Executed`
- `Other`

### **Priority Options:**
- `P0 (Blocker)`
- `P1 (High)`
- `P2 (Medium)`
- `P3 (Low)`
- `Other`

### **Category Options:**
- `Recording`
- `Transcription`
- `Notifications`
- `Calling`
- `UI/UX`
- `Other`

### **Environment Options:**
- `Android`
- `iOS`
- `Web`
- `Backend`
- `Other`

### **Platform Options:**
- `Android`
- `iOS`
- `Web`
- `Cross-platform`
- `Other`

---

## 🚀 **How to Import Your Excel File**

### **Step 1: Prepare Your Excel File**
1. **Open Excel** or Google Sheets
2. **Create headers** in Row 1 (use exact names from table above)
3. **Add your test cases** starting from Row 2
4. **Use exact dropdown values** (case-sensitive)
5. **Save as .xlsx format**

### **Step 2: Import Process**
1. **Open your QA Management App** at `http://localhost:3000`
2. **Navigate to Test Cases** table view
3. **Click "Import" button** in the top-right
4. **Select "Enhanced Import"** option
5. **Upload your Excel file** (.xlsx)
6. **Review the preview** and field mapping
7. **Click "Import"** to complete

### **Step 3: Import Preview**
The system will show you:
- ✅ **File detected**: Excel format recognized
- ✅ **Field mapping**: Headers mapped to internal fields
- ✅ **Data preview**: First 10 rows of your data
- ✅ **Validation results**: Any issues found
- ✅ **Duplicate detection**: Similar test cases found

---

## 🔧 **Field Mapping System**

### **Automatic Mapping**
The system automatically maps these common variations:

| Your Header | Maps To | Example |
|-------------|---------|---------|
| `Test Case` | `testCase` | TC001 |
| `Test Case ID` | `testCase` | TC001 |
| `TC ID` | `testCase` | TC001 |
| `Status` | `status` | Pass |
| `Test Status` | `status` | Pass |
| `Priority` | `priority` | P1 (High) |
| `Test Priority` | `priority` | P1 (High) |
| `Category` | `category` | UI/UX |
| `Test Category` | `category` | UI/UX |
| `Description` | `description` | Test description |
| `Test Description` | `description` | Test description |
| `Steps` | `stepsToReproduce` | Step-by-step instructions |
| `Steps to Reproduce` | `stepsToReproduce` | Step-by-step instructions |
| `Expected` | `expectedResult` | Expected outcome |
| `Expected Result` | `expectedResult` | Expected outcome |

---

## ✅ **Validation Rules**

### **Required Fields:**
- ✅ `Test Case` (must be unique)
- ✅ `Description` (cannot be empty)
- ✅ `Status` (must be valid dropdown value)

### **Optional Fields:**
- 🔸 `Priority` (defaults to "P2 (Medium)")
- 🔸 `Category` (defaults to "Other")
- 🔸 `Environment` (defaults to "Other")
- 🔸 `Platform` (defaults to "Other")

### **Auto-Fixes Applied:**
- 🔧 **Status normalization**: "pending" → "Not Executed"
- 🔧 **Priority normalization**: "high" → "P1 (High)"
- 🔧 **Category normalization**: "functional" → "Other"
- 🔧 **Email validation**: Invalid emails flagged
- 🔧 **Date formatting**: Auto-format dates

---

## 🎯 **Sample Excel File Content**

### **Complete Test Case Example:**
```
# | Test Case | Description | Expected Result | Status | Priority | Category | Assigned Tester | Execution Date | Notes | Actual Result | Environment | Prerequisites | Platform | Steps to Reproduce | Test Suite | Position | Created At | Updated At | Automation Script | Custom Fields | QA Status | Dev Status | Assigned Developer | Bug Status | Test Type | Test Level | Defect Severity | Defect Priority | Estimated Time | Actual Time | Test Data | Attachments | Tags | Reviewer | Review Date | Review Notes | Last Modified By | Last Modified Date | Actions
1 | TC001 | Verify user login with valid credentials | User should be successfully logged in and redirected to dashboard | Pass | P1 (High) | UI/UX | john.doe@example.com | 2024-01-15 | Test completed successfully | Login successful, redirected to dashboard | Web | Valid user account exists | Web | 1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click login button | Smoke | 1 | 2024-01-15 10:30:00 | 2024-01-15 14:45:00 | Yes | | Approved | Closed | dev@example.com | Closed | Functional | System | Minor | P2 | 30 | 25 | Test user credentials | screenshot.png | UI,Login | reviewer@example.com | 2024-01-16 | Approved for release | user@example.com | 2024-01-16 09:15:00 | Close
```

---

## 🚨 **Common Import Issues & Solutions**

### **Issue 1: "Invalid Status Value"**
**Problem**: Using old status values like "Pending"
**Solution**: Use new values: `Pass`, `Fail`, `Blocked`, `In Progress`, `Not Executed`, `Other`

### **Issue 2: "Invalid Priority Value"**
**Problem**: Using old priority values like "High"
**Solution**: Use new values: `P0 (Blocker)`, `P1 (High)`, `P2 (Medium)`, `P3 (Low)`, `Other`

### **Issue 3: "Invalid Category Value"**
**Problem**: Using old category values like "Functional"
**Solution**: Use new values: `Recording`, `Transcription`, `Notifications`, `Calling`, `UI/UX`, `Other`

### **Issue 4: "Field Mapping Failed"**
**Problem**: Column headers don't match expected names
**Solution**: Use exact header names from the table above

### **Issue 5: "Duplicate Test Cases Found"**
**Problem**: Multiple rows with same test case name
**Solution**: Make test case names unique (TC001, TC002, TC003, etc.)

---

## 📋 **Quick Start Template**

### **Minimal Excel File (5 columns):**
```
Test Case | Description | Expected Result | Status | Priority
TC001 | Verify user login | User logged in successfully | Pass | P1 (High)
TC002 | Verify user logout | User logged out successfully | Pass | P2 (Medium)
TC003 | Verify password reset | Password reset email sent | Not Executed | P2 (Medium)
```

### **Standard Excel File (15 columns):**
```
Test Case | Description | Expected Result | Status | Priority | Category | Assigned Tester | Environment | Platform | Steps to Reproduce | Test Suite | QA Status | Dev Status | Test Type | Actions
TC001 | Verify user login | User logged in successfully | Pass | P1 (High) | UI/UX | john.doe@example.com | Web | Web | 1. Go to login page\n2. Enter credentials\n3. Click login | Smoke | Approved | Closed | Functional | Close
```

---

## 🎉 **Ready to Import!**

Your Excel file is now ready for import. The system will:
- ✅ **Auto-detect** your column headers
- ✅ **Map fields** to internal structure
- ✅ **Validate data** and show any issues
- ✅ **Import all test cases** with proper formatting
- ✅ **Handle duplicates** intelligently
- ✅ **Apply auto-fixes** for common issues

**Start importing your test cases now!** 🚀
