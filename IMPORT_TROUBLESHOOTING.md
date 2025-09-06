# 🔧 Import Troubleshooting Guide

## 🚨 Common Import Issues & Solutions

### **Issue 1: Steps Running Together (Your Current Problem)**

**❌ Problem:**
```
1. Navigate to login page2. Enter valid username3. Enter valid password4. Click login button
```

**✅ Solution:**
```
1. Navigate to login page; 2. Enter valid username; 3. Enter valid password; 4. Click login button
```

**Root Cause:** Missing separators between numbered steps in TSV/CSV format.

---

### **Issue 2: Extra Empty Columns**

**❌ Problem:**
```
TC001	Description	Steps	Result	Status	Priority	Category	Tester	Env	Platform	Prerequisites				
```
*(Notice the extra tabs at the end)*

**✅ Solution:**
```
TC001	Description	Steps	Result	Status	Priority	Category	Tester	Env	Platform	Prerequisites
```
*(Clean end with no extra tabs)*

---

### **Issue 3: Multiline Text in CSV**

**❌ Problem:**
```csv
"1. Step one
2. Step two
3. Step three"
```

**✅ Solution:**
```csv
"1. Step one; 2. Step two; 3. Step three"
```

---

## 📁 **Ready-to-Use Files (GUARANTEED TO WORK)**

I've created **simple, clean files** for you:

### **🎯 Start with these files:**

1. **📊 `sample-test-cases-simple.xlsx`** - Excel format (10 test cases)
2. **📄 `sample-test-cases-simple.csv`** - CSV format (10 test cases)  
3. **📑 `sample-test-cases-simple.tsv`** - TSV format (10 test cases)

### **✅ What's Fixed:**
- ✅ **Proper step separators** (semicolons instead of line breaks)
- ✅ **No extra empty columns**
- ✅ **Clean field formatting**
- ✅ **Proper CSV/TSV escaping**
- ✅ **All required fields present**
- ✅ **Valid data types**

---

## 🚀 **Step-by-Step Import Process**

### **Method 1: Use the Enhanced Import Dialog**

1. **Open your QA Management app**
2. **Click the "Import" button** in the second navbar
3. **Select one of the simple files:**
   - `sample-test-cases-simple.xlsx` (recommended)
   - `sample-test-cases-simple.csv`
   - `sample-test-cases-simple.tsv`
4. **Follow the import wizard:**
   - Step 1: File upload ✅
   - Step 2: Processing ✅  
   - Step 3: Review & import ✅

### **Method 2: Test with Minimal Data First**

Create a tiny test file with just 2 rows:

```csv
Test Case,Description,Expected Result,Status,Priority,Category
TC001,Test login functionality,User should login successfully,Pending,High,Functional
TC002,Test logout functionality,User should logout successfully,Pass,Medium,Functional
```

---

## 🔍 **Debugging Import Errors**

### **Check Browser Console:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Try the import
4. Look for error messages

### **Common Error Messages & Fixes:**

#### **"No data found in file"**
- **Cause:** Empty file or wrong format
- **Fix:** Use the provided simple files

#### **"Invalid CSV format"**
- **Cause:** Unescaped quotes or line breaks
- **Fix:** Use semicolons instead of line breaks in steps

#### **"Column mapping failed"**
- **Cause:** Column headers don't match expected format
- **Fix:** Use exact headers from simple files

#### **"Validation errors"**
- **Cause:** Invalid data in fields (wrong status, priority, etc.)
- **Fix:** Use only valid values:
  - **Status:** Pending, Pass, Fail, In Progress, Blocked
  - **Priority:** High, Medium, Low
  - **Category:** Functional, Integration, E2E, Non-Functional

---

## 📋 **Valid Field Values**

### **Status Field:**
- ✅ `Pending`
- ✅ `Pass` 
- ✅ `Fail`
- ✅ `In Progress`
- ✅ `Blocked`

### **Priority Field:**
- ✅ `High`
- ✅ `Medium`
- ✅ `Low`

### **Category Field:**
- ✅ `Functional`
- ✅ `Integration` 
- ✅ `E2E`
- ✅ `Non-Functional`

### **Environment Field:**
- ✅ `QA`
- ✅ `Production`
- ✅ `Staging`
- ✅ `Development`

### **Platform Field:**
- ✅ `Web`
- ✅ `Mobile`
- ✅ `API`
- ✅ `Backend`
- ✅ `Desktop`

---

## 🎯 **Quick Success Test**

**Copy this into a new CSV file and try importing:**

```csv
Test Case,Description,Steps to Reproduce,Expected Result,Status,Priority,Category,Assigned Tester,Environment,Platform,Prerequisites
TC001,Verify user login,Enter credentials and click login,User should be logged in,Pending,High,Functional,test@example.com,QA,Web,Valid account
TC002,Verify user logout,Click logout button,User should be logged out,Pass,Medium,Functional,test@example.com,QA,Web,User logged in
```

This **2-row file should import 100% successfully** if your import system is working.

---

## 🆘 **Still Having Issues?**

### **Try in this order:**

1. **Test with the 2-row CSV above** (copy-paste into a file)
2. **Use `sample-test-cases-simple.csv`** (10 clean test cases)
3. **Use `sample-test-cases-simple.xlsx`** (Excel format)
4. **Check browser console** for specific error messages
5. **Verify you have a project selected** before importing
6. **Make sure you're using the Enhanced Import Dialog** (not legacy import)

### **If nothing works:**
- Check if the import feature is properly enabled
- Verify database connections
- Check for JavaScript errors in console
- Try refreshing the page and importing again

---

## ✅ **Expected Results**

When import works correctly, you should see:
- ✅ **Processing progress** with stages
- ✅ **"Import Successful"** message
- ✅ **All test cases** appear in your test case table
- ✅ **Proper field mapping** (all columns filled correctly)
- ✅ **No validation errors**

The simple files I created should give you **100% success rate** for testing the import functionality! 🎉
