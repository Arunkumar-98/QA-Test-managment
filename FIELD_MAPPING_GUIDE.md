# 📋 Complete Field Mapping Guide

## 🎯 **Available Table Headers in QA Management System**

Based on your system, here are all the available fields and their mapping:

### **✅ Core Test Case Fields**
| # | Table Header | Internal Field | Import Header Variations | Required | Auto-Default |
|---|--------------|----------------|-------------------------|----------|--------------|
| 1 | **Test Case** | `testCase` | "Test Case", "Test Case ID", "Test Case Name", "TC", "ID" | ✅ **YES** | - |
| 2 | **Description** | `description` | "Description", "Desc", "Details", "Summary" | No | Empty string |
| 3 | **Expected Result** | `expectedResult` | "Expected Result", "Expected", "Expected Outcome" | No | Empty string |
| 4 | **Status** | `status` | "Status", "Test Status", "Execution Status" | No | "Pending" |
| 5 | **Priority** | `priority` | "Priority", "Test Priority", "Importance" | No | "Medium" |
| 6 | **Category** | `category` | "Category", "Test Category", "Type", "Test Type" | No | "Functional" |

### **✅ Assignment & Execution Fields**
| # | Table Header | Internal Field | Import Header Variations | Required | Auto-Default |
|---|--------------|----------------|-------------------------|----------|--------------|
| 7 | **Assigned Tester** | `assignedTester` | "Assigned Tester", "Assigned To", "Tester", "Owner" | No | Empty string |
| 8 | **Execution Date** | `executionDate` | "Execution Date", "Date", "Test Date", "Run Date" | No | Empty string |
| 9 | **Notes** | `notes` | "Notes", "Comments", "Remarks", "Additional Info" | No | Empty string |
| 10 | **Actual Result** | `actualResult` | "Actual Result", "Actual", "Result", "Output" | No | Empty string |

### **✅ Environment & Setup Fields**
| # | Table Header | Internal Field | Import Header Variations | Required | Auto-Default |
|---|--------------|----------------|-------------------------|----------|--------------|
| 11 | **Environment** | `environment` | "Environment", "Env", "Test Environment" | No | Empty string |
| 12 | **Prerequisites** | `prerequisites` | "Prerequisites", "Preconditions", "Setup", "Pre-req" | No | Empty string |
| 13 | **Platform** | `platform` | "Platform", "OS", "Operating System", "Device" | No | Empty string |
| 14 | **Steps to Reproduce** | `stepsToReproduce` | "Steps to Reproduce", "Steps", "Test Steps", "Procedure" | No | Empty string |

### **✅ Organization Fields**
| # | Table Header | Internal Field | Import Header Variations | Required | Auto-Default |
|---|--------------|----------------|-------------------------|----------|--------------|
| 15 | **Test Suite** | `suiteId` | "Test Suite", "Suite", "Test Suite Name" | No | Current selected suite |
| 16 | **Position** | `position` | "Position", "Order", "Sequence" | No | Auto-numbered |
| 17 | **Created At** | `createdAt` | "Created At", "Created Date", "Creation Date" | No | Current timestamp |
| 18 | **Updated At** | `updatedAt` | "Updated At", "Modified Date", "Last Updated" | No | Current timestamp |

### **✅ Advanced Fields (New Core Columns)**
| # | Table Header | Internal Field | Import Header Variations | Required | Auto-Default |
|---|--------------|----------------|-------------------------|----------|--------------|
| 19 | **Automation Script** | `automationScript` | "Automation Script", "Script", "Automation" | No | Empty object |
| 20 | **Custom Fields** | `customFields` | "Custom Fields", "Additional Fields" | No | Empty object |
| 21 | **QA Status** | `qaStatus` | "QA Status", "QA State", "Quality Status" | No | "Not Started" |
| 22 | **Dev Status** | `devStatus` | "Dev Status", "Development Status", "Developer Status" | No | "Not Started" |
| 23 | **Assigned Developer** | `assignedDev` | "Assigned Developer", "Assigned Dev", "Developer" | No | Empty string |
| 24 | **Bug Status** | `bugStatus` | "Bug Status", "Defect Status", "Issue Status" | No | "Open" |

### **✅ Test Classification Fields**
| # | Table Header | Internal Field | Import Header Variations | Required | Auto-Default |
|---|--------------|----------------|-------------------------|----------|--------------|
| 25 | **Test Type** | `testType` | "Test Type", "Type", "Testing Type" | No | "Manual" |
| 26 | **Test Level** | `testLevel` | "Test Level", "Level", "Testing Level" | No | "System" |
| 27 | **Defect Severity** | `defectSeverity` | "Defect Severity", "Severity", "Bug Severity" | No | "Medium" |
| 28 | **Defect Priority** | `defectPriority` | "Defect Priority", "Bug Priority", "Issue Priority" | No | "P3" |

### **✅ Time Tracking Fields**
| # | Table Header | Internal Field | Import Header Variations | Required | Auto-Default |
|---|--------------|----------------|-------------------------|----------|--------------|
| 29 | **Estimated Time** | `estimatedTime` | "Estimated Time", "Estimate", "Time Estimate" | No | 0 |
| 30 | **Actual Time** | `actualTime` | "Actual Time", "Time Spent", "Duration" | No | 0 |

### **✅ Additional Data Fields**
| # | Table Header | Internal Field | Import Header Variations | Required | Auto-Default |
|---|--------------|----------------|-------------------------|----------|--------------|
| 31 | **Test Data** | `testData` | "Test Data", "Data", "Test Input" | No | Empty string |
| 32 | **Attachments** | `attachments` | "Attachments", "Files", "Documents" | No | Empty array |
| 33 | **Tags** | `tags` | "Tags", "Labels", "Keywords" | No | Empty array |

### **✅ Review & Audit Fields**
| # | Table Header | Internal Field | Import Header Variations | Required | Auto-Default |
|---|--------------|----------------|-------------------------|----------|--------------|
| 34 | **Reviewer** | `reviewer` | "Reviewer", "Reviewed By", "Review Owner" | No | Empty string |
| 35 | **Review Date** | `reviewDate` | "Review Date", "Reviewed Date", "Review Time" | No | Empty string |
| 36 | **Review Notes** | `reviewNotes` | "Review Notes", "Review Comments", "Review Feedback" | No | Empty string |
| 37 | **Last Modified By** | `lastModifiedBy` | "Last Modified By", "Modified By", "Changed By" | No | "Import System" |
| 38 | **Last Modified Date** | `lastModifiedDate` | "Last Modified Date", "Modified Date" | No | Current timestamp |

### **✅ System Fields (Auto-Generated)**
| # | Table Header | Internal Field | Notes |
|---|--------------|----------------|--------|
| 39 | **Actions** | - | UI-only field, not imported |
| - | **ID** | `id` | Auto-generated by database |
| - | **Project ID** | `projectId` | Set to current project |

---

## 🎯 **Import Recommendations**

### **📊 Minimal Import (Recommended for Testing)**
```csv
Test Case,Description
TC001,Verify user login functionality
TC002,Verify user logout functionality
```

### **📋 Basic Import (Good for Most Cases)**
```csv
Test Case,Description,Expected Result,Status,Priority,Category
TC001,Verify user login,User should login successfully,Pending,High,Functional
TC002,Verify user logout,User should logout successfully,Pass,Medium,Functional
```

### **📈 Complete Import (Full Data)**
```csv
Test Case,Description,Expected Result,Status,Priority,Category,Assigned Tester,Environment,Platform,Prerequisites,Steps to Reproduce
TC001,Verify user login,User should login successfully,Pending,High,Functional,test@example.com,QA,Web,Valid account,1. Open login page; 2. Enter credentials; 3. Click login
```

---

## ✅ **Valid Field Values**

### **Status Field:**
- `Pass`, `Fail`, `Blocked`, `In Progress`, `Not Executed`, `Other`

### **Priority Field:**
- `P0 (Blocker)`, `P1 (High)`, `P2 (Medium)`, `P3 (Low)`, `Other`

### **Category Field:**
- `Recording`, `Transcription`, `Notifications`, `Calling`, `UI/UX`, `Other`

### **Environment Field:**
- `Android`, `iOS`, `Web`, `Backend`, `Other`

### **Platform Field:**
- `Android`, `iOS`, `Web`, `Cross-platform`, `Other`

### **QA Status Field:**
- `New`, `Reviewed`, `Approved`, `Rejected`, `Other`

### **Dev Status Field:**
- `Open`, `In Progress`, `Fixed`, `Reopened`, `Closed`, `Other`

### **Bug Status Field:**
- `New`, `In Progress`, `Verified`, `Closed`, `Reopened`, `Deferred`, `Other`

### **Test Type Field:**
- `Functional`, `Regression`, `Smoke`, `Performance`, `Security`, `Other`

### **Test Level Field:**
- `Unit`, `Integration`, `System`, `UAT`, `Other`

### **Defect Severity Field:**
- `Critical`, `Major`, `Minor`, `Trivial`, `Other`

### **Defect Priority Field:**
- `P0`, `P1`, `P2`, `P3`, `Other`

---

## 🚀 **Import Success Tips**

### **✅ What Will Always Work:**
1. **Use exact header names** from the table above
2. **Include at least "Test Case"** (only required field)
3. **Use valid values** for status, priority, category fields
4. **Keep it simple** - start with basic fields and add more as needed

### **✅ What Gets Auto-Filled:**
- Missing optional fields get intelligent defaults
- System fields (ID, timestamps, project) are auto-generated
- Position numbers are auto-assigned
- Empty arrays/objects for complex fields

### **✅ Field Mapping Intelligence:**
The system recognizes **50+ header variations**, so these all work:
- "Test Case" = "Test Case ID" = "TC" = "Test Case Name"
- "Description" = "Desc" = "Details" = "Summary"
- "Expected Result" = "Expected" = "Expected Outcome"

Your Enhanced Import Dialog now supports **all 39 fields** with intelligent mapping and defaults! 🎯
