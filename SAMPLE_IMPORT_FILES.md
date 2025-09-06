# 📊 Sample Import Test Files

## 📋 Overview

This directory contains comprehensive sample test case files in multiple formats to test the enhanced import functionality. All files contain **52 realistic test cases** with diverse scenarios, priorities, and categories.

## 📁 Available Files

### **1. Excel Format (.xlsx)**
- **File**: `sample-test-cases-import.xlsx`
- **Size**: ~52KB
- **Features**: 
  - Optimized column widths for readability
  - Professional formatting
  - Full 52 test cases with complete details

### **2. CSV Format (.csv)**
- **File**: `sample-test-cases-import.csv`
- **Size**: ~15KB
- **Features**:
  - Standard comma-separated values
  - Handles complex data with quotes and newlines
  - Compatible with all spreadsheet applications

### **3. JSON Format (.json)**
- **File**: `sample-test-cases-import.json`
- **Size**: ~5KB (first 10 test cases for quick testing)
- **Features**:
  - Structured JSON array format
  - Proper field mapping for API-style imports
  - Smaller subset for rapid testing

### **4. TSV Format (.tsv)**
- **File**: `sample-test-cases-import.tsv`
- **Size**: ~4KB (first 15 test cases)
- **Features**:
  - Tab-separated values
  - Alternative delimiter format
  - Tests delimiter detection capabilities

---

## 🎯 Test Case Categories

### **Distribution Breakdown:**

#### **📈 Status Distribution:**
- **Pending**: 18 test cases (35%)
- **Pass**: 18 test cases (35%)
- **Fail**: 7 test cases (13%)
- **In Progress**: 7 test cases (13%)
- **Blocked**: 2 test cases (4%)

#### **⭐ Priority Distribution:**
- **High**: 19 test cases (37%)
- **Medium**: 26 test cases (50%)
- **Low**: 7 test cases (13%)

#### **📂 Category Distribution:**
- **Functional**: 29 test cases (56%)
- **Non-Functional**: 14 test cases (27%)
- **Integration**: 8 test cases (15%)
- **E2E**: 1 test case (2%)

---

## 🧪 Test Scenarios Included

### **Authentication & Authorization:**
- User login (valid/invalid credentials)
- Password reset functionality
- User registration
- Role-based access control
- Two-factor authentication
- Session timeout

### **E-commerce & Shopping:**
- Shopping cart operations
- Checkout process
- Payment processing (Credit Card, PayPal)
- Order confirmation emails
- Inventory management

### **Data Management:**
- File upload/download
- Data import/export
- Bulk operations
- Data validation
- Search functionality
- Advanced filtering

### **Performance & Compatibility:**
- Page load performance
- Cross-browser compatibility (Chrome, Firefox)
- Mobile responsive design
- API response times
- Cache invalidation

### **System Integration:**
- Social media login (Google OAuth)
- Email notifications
- Webhook notifications
- Data synchronization
- Third-party integrations

### **Security & Compliance:**
- SSL certificate validation
- GDPR compliance
- Data retention policies
- Audit logging
- Error logging and monitoring

### **Content & Communication:**
- Content management system
- Real-time chat
- Push notifications
- Email template customization
- Multi-language support

---

## 🔧 Field Mapping Guide

### **Standard Fields Included:**
| Field Name | Description | Example Values |
|------------|-------------|----------------|
| **Test Case** | Unique test case identifier | TC001, TC002, etc. |
| **Description** | Clear description of what is being tested | "Verify user login with valid credentials" |
| **Steps to Reproduce** | Detailed step-by-step instructions | Numbered steps with clear actions |
| **Expected Result** | What should happen when test passes | Specific, measurable outcomes |
| **Status** | Current test execution status | Pending, Pass, Fail, In Progress, Blocked |
| **Priority** | Test importance level | High, Medium, Low |
| **Category** | Type of testing | Functional, Integration, E2E, Non-Functional |
| **Assigned Tester** | Who is responsible for the test | Email addresses (realistic examples) |
| **Environment** | Where the test should be run | QA, Production, Staging |
| **Platform** | Target platform or system | Web, Mobile, API, Backend, Email |
| **Prerequisites** | Requirements before running test | Setup conditions and dependencies |

---

## 🚀 Testing the Import System

### **Recommended Test Sequence:**

#### **1. Basic Import Testing:**
1. Start with **CSV file** (most common format)
2. Test **Excel file** (complex formatting)
3. Try **JSON file** (API-style data)
4. Test **TSV file** (alternative delimiter)

#### **2. Advanced Feature Testing:**

##### **Duplicate Detection:**
- Import the same file twice
- Test fuzzy matching with similar test case names
- Verify resolution strategies (keep first, merge, etc.)

##### **Validation Testing:**
- Modify files to include invalid data
- Test empty required fields
- Try invalid email addresses
- Test invalid status/priority values

##### **Error Handling:**
- Upload corrupted files
- Try unsupported file formats
- Test extremely large files
- Upload files with special characters

##### **Template System:**
- Test auto-detection with different column headers
- Create custom templates
- Import files with non-standard column names

#### **3. Performance Testing:**
- Test with the full 52-record Excel file
- Measure import processing time
- Test chunked processing behavior
- Monitor memory usage during import

---

## 📝 Sample Data Quality

### **Realistic Test Cases:**
- **Authentic scenarios** from real-world applications
- **Diverse complexity** from simple login tests to complex integrations
- **Professional naming** conventions (TC001, TC002, etc.)
- **Detailed steps** with clear, actionable instructions
- **Specific expected results** for accurate validation
- **Realistic email addresses** for tester assignments
- **Varied environments** and platforms
- **Meaningful prerequisites** and dependencies

### **Data Variations for Testing:**
- **Mixed case** in status and priority fields
- **Long descriptions** to test text handling
- **Multi-line steps** with proper formatting
- **Special characters** in various fields
- **Email addresses** in different formats
- **Date references** in descriptions
- **Technical terminology** and domain-specific language

---

## 🎯 Expected Import Results

### **Successful Import Should:**
- Import all 52 test cases from Excel/CSV files
- Correctly map all field types
- Handle multi-line text in steps and descriptions
- Preserve formatting and special characters
- Assign proper status, priority, and category values
- Validate email addresses in tester assignments
- Apply auto-fixes for common data issues

### **Validation Should Detect:**
- Missing required fields (if any)
- Invalid email formats
- Unrecognized status/priority values
- Overly long field values
- Generic or placeholder test case names

### **Duplicate Detection Should:**
- Identify similar test case names
- Calculate similarity scores
- Offer resolution strategies
- Preview merge results

---

## 🛠️ Customization Options

### **Create Your Own Test Files:**
1. Use the provided files as templates
2. Modify test cases for your domain
3. Add custom fields as needed
4. Test different data scenarios
5. Include edge cases specific to your application

### **Template Variations:**
- **Jira Export Format**: Modify column headers to match Jira
- **Azure DevOps Format**: Adjust for Azure DevOps field names
- **TestRail Format**: Adapt for TestRail export structure
- **Custom Format**: Create domain-specific templates

---

## ✅ Quality Assurance

### **Files Have Been Tested For:**
- ✅ **Format Validity**: All files open correctly in respective applications
- ✅ **Character Encoding**: Proper UTF-8 encoding for special characters
- ✅ **Data Integrity**: All 52 test cases present and complete
- ✅ **Field Consistency**: Consistent field names and data types
- ✅ **Import Compatibility**: Compatible with enhanced import system
- ✅ **Edge Cases**: Includes various data scenarios and edge cases

---

## 📚 Additional Resources

### **For Developers:**
- Use these files to test import validation logic
- Verify error handling with modified versions
- Test performance with larger datasets
- Validate template auto-detection algorithms

### **For QA Teams:**
- Use as realistic test data for import testing
- Modify for domain-specific test scenarios
- Create regression test suites
- Validate import/export round-trip accuracy

### **For End Users:**
- Reference for proper file formatting
- Examples of complete test case documentation
- Templates for creating import files
- Best practices for data preparation

---

**🎉 Ready for comprehensive import system testing!**

These sample files provide everything needed to thoroughly test the enhanced import functionality, from basic file processing to advanced features like duplicate detection, validation, and template mapping.
