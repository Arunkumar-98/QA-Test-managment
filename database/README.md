# 🗄️ QA Management System - Database Documentation

## 📋 **Overview**

This directory contains the complete database setup for the QA Management System, supporting all 39 table headers with proper constraints, indexes, and sample data.

## 📁 **File Structure**

```
database/
├── README.md                           # This documentation file
├── test_cases_schema.sql              # Complete database schema
├── sample_test_cases_data.sql         # Sample data insertion
├── common_queries.sql                 # Useful queries for daily operations
└── setup_database.sql                 # Complete setup script
```

## 🚀 **Quick Setup**

### **Option 1: Complete Setup (Recommended)**
```bash
# Run the complete setup script
psql -d your_database_name -f database/setup_database.sql
```

### **Option 2: Step-by-Step Setup**
```bash
# 1. Create schema
psql -d your_database_name -f database/test_cases_schema.sql

# 2. Insert sample data
psql -d your_database_name -f database/sample_test_cases_data.sql

# 3. Run additional setup
psql -d your_database_name -f database/setup_database.sql
```

## 📊 **Database Schema**

### **Core Tables**

#### **1. `projects`**
- **Purpose:** Store project information
- **Key Fields:** `id`, `name`, `description`, `created_at`, `updated_at`

#### **2. `test_suites`**
- **Purpose:** Organize test cases into logical groups
- **Key Fields:** `id`, `name`, `description`, `project_id`

#### **3. `users`**
- **Purpose:** Store team member information
- **Key Fields:** `id`, `email`, `name`, `role` (QA, Developer, Reviewer, Admin)

#### **4. `test_cases`** (Main Table)
- **Purpose:** Store all test case data with 39 fields
- **Key Fields:** All fields from your specification

### **Enum Types (Dropdown Values)**

The database uses PostgreSQL ENUMs to ensure data integrity:

#### **✅ Status Values**
```sql
'Pass', 'Fail', 'Blocked', 'In Progress', 'Not Executed', 'Other'
```

#### **✅ Priority Values**
```sql
'P0 (Blocker)', 'P1 (High)', 'P2 (Medium)', 'P3 (Low)', 'Other'
```

#### **✅ Category Values**
```sql
'Recording', 'Transcription', 'Notifications', 'Calling', 'UI/UX', 'Other'
```

#### **✅ Environment Values**
```sql
'Android', 'iOS', 'Web', 'Backend', 'Other'
```

#### **✅ Platform Values**
```sql
'Android', 'iOS', 'Web', 'Cross-platform', 'Other'
```

#### **✅ QA Status Values**
```sql
'New', 'Reviewed', 'Approved', 'Rejected', 'Other'
```

#### **✅ Dev Status Values**
```sql
'Open', 'In Progress', 'Fixed', 'Reopened', 'Closed', 'Other'
```

#### **✅ Bug Status Values**
```sql
'New', 'In Progress', 'Verified', 'Closed', 'Reopened', 'Deferred', 'Other'
```

#### **✅ Test Type Values**
```sql
'Functional', 'Regression', 'Smoke', 'Performance', 'Security', 'Other'
```

#### **✅ Test Level Values**
```sql
'Unit', 'Integration', 'System', 'UAT', 'Other'
```

#### **✅ Defect Severity Values**
```sql
'Critical', 'Major', 'Minor', 'Trivial', 'Other'
```

#### **✅ Defect Priority Values**
```sql
'P0', 'P1', 'P2', 'P3', 'Other'
```

## 🔍 **Key Features**

### **✅ Data Integrity**
- **ENUM constraints** ensure only valid dropdown values
- **Foreign key relationships** maintain referential integrity
- **Unique constraints** prevent duplicate test cases per project
- **NOT NULL constraints** on required fields

### **✅ Performance Optimization**
- **25+ indexes** for fast querying
- **Composite indexes** for complex filters
- **Full-text search indexes** for content search
- **Trigonometric indexes** for fuzzy matching

### **✅ Automatic Updates**
- **Triggers** automatically update `updated_at` timestamps
- **Triggers** track `last_modified_date` for audit trails
- **Default values** for all optional fields

### **✅ Advanced Data Types**
- **UUID primary keys** for scalability
- **JSONB fields** for flexible data (automation_script, custom_fields)
- **Array fields** for tags and attachments
- **Date/time fields** with timezone support

## 📈 **Views for Reporting**

### **1. `test_case_summary`**
Complete test case overview with project and suite information.

### **2. `dashboard_stats`**
Aggregated statistics for dashboard displays.

### **3. `test_execution_summary`**
Daily test execution metrics.

### **4. `team_workload`**
QA and Development team workload distribution.

### **5. `defect_tracking`**
Defect severity and priority distribution.

## 🔧 **Stored Procedures**

### **1. `update_test_case_status()`**
```sql
CALL update_test_case_status(
    'test-case-uuid',
    'Pass',
    'Test passed successfully',
    15,
    'Additional notes'
);
```

### **2. `assign_test_case()`**
```sql
CALL assign_test_case(
    'test-case-uuid',
    'john.doe@example.com',
    'dev.smith@example.com'
);
```

### **3. `create_test_case()`**
```sql
CALL create_test_case(
    'TC001',
    'Verify user login',
    'User should login successfully',
    'P1 (High)',
    'UI/UX',
    'project-uuid',
    'suite-uuid',
    'john.doe@example.com'
);
```

## 📊 **Analytics Functions**

### **1. `get_test_execution_metrics()`**
```sql
SELECT * FROM get_test_execution_metrics(
    'project-uuid',
    '2024-01-01',
    '2024-12-31'
);
```

### **2. `get_test_case_trends()`**
```sql
SELECT * FROM get_test_case_trends(
    'project-uuid',
    30  -- days
);
```

## 🔍 **Common Queries**

The `common_queries.sql` file contains 29 pre-built queries for:

### **📊 Dashboard Queries**
- Overall test case statistics
- Test cases by project and suite
- Priority distribution

### **👥 Assignment Queries**
- Test cases assigned to each tester
- Developer workload
- QA status overview

### **📋 Category Analysis**
- Test cases by category
- Environment and platform distribution
- Test type analysis

### **⏱️ Time Tracking**
- Time tracking summary
- Test cases taking longer than estimated
- Efficiency analysis

### **🐛 Bug Tracking**
- Bug status overview
- Defect severity distribution
- Critical and major defects

### **🔍 Search and Filter**
- Keyword search across all fields
- Multi-criteria filtering
- Advanced search capabilities

### **📈 Reporting**
- Weekly test execution reports
- Test case creation trends
- Execution trends

### **📊 Performance Analysis**
- Execution time efficiency
- Most time-consuming tests
- Team performance metrics

### **🔧 Data Quality**
- Missing required information
- Duplicate test cases
- Unassigned test cases

### **📤 Export Queries**
- Complete test case export
- Management summary reports

## 📝 **Sample Data**

The database includes **10 comprehensive test cases** covering:

### **✅ Core Test Cases (5)**
- User login functionality
- User logout functionality
- Password reset functionality
- API response time
- Mobile responsive design

### **✅ Category-Specific Test Cases (5)**
- Audio recording (Recording category)
- Speech-to-text transcription (Transcription category)
- Voice call functionality (Calling category)
- SQL injection prevention (Security category)
- User profile update regression (Regression category)

## 🛠️ **Maintenance and Optimization**

### **✅ Regular Maintenance**
```sql
-- Analyze table statistics
ANALYZE test_cases;

-- Vacuum to reclaim space
VACUUM ANALYZE test_cases;

-- Reindex for performance
REINDEX TABLE test_cases;
```

### **✅ Performance Monitoring**
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'test_cases'
ORDER BY idx_scan DESC;

-- Check table statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE tablename = 'test_cases';
```

## 🔒 **Security Considerations**

### **✅ Data Protection**
- **UUID primary keys** prevent enumeration attacks
- **Input validation** through ENUM constraints
- **SQL injection prevention** through parameterized queries
- **Access control** through database roles

### **✅ Audit Trail**
- **Automatic timestamp updates** track all changes
- **Last modified tracking** for accountability
- **Comprehensive logging** of all operations

## 📚 **Integration with Frontend**

### **✅ Supabase Integration**
The database schema is designed to work seamlessly with Supabase:

```typescript
// Example Supabase query
const { data, error } = await supabase
  .from('test_cases')
  .select(`
    *,
    projects(name),
    test_suites(name)
  `)
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });
```

### **✅ Real-time Features**
- **Row Level Security (RLS)** for multi-tenant access
- **Real-time subscriptions** for live updates
- **Edge functions** for complex operations

## 🚀 **Next Steps**

1. **Run the setup script** to create the database
2. **Import your existing data** using the Enhanced Import Dialog
3. **Customize the schema** if needed for your specific requirements
4. **Set up monitoring** for performance and usage
5. **Train your team** on the new system

## 📞 **Support**

For questions or issues with the database setup:

1. **Check the logs** for detailed error messages
2. **Verify PostgreSQL version** (12+ recommended)
3. **Ensure proper permissions** for database creation
4. **Review the schema** for any custom modifications needed

---

**🎯 Your QA Management System database is now enterprise-ready with comprehensive test case management capabilities!**
