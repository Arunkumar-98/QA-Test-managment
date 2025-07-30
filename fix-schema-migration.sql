-- Complete Schema Migration for QA Test Management System
-- This script ensures all tables have the correct structure for the application

-- 1. Add missing project_id columns to all tables that need them
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE important_links ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS project_id UUID;

-- 2. Add missing created_at columns (if they don't exist)
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Set default project_id for existing records that don't have one
UPDATE platforms 
SET project_id = (SELECT id FROM projects LIMIT 1)
WHERE project_id IS NULL;

UPDATE test_cases 
SET project_id = (SELECT id FROM projects LIMIT 1)
WHERE project_id IS NULL;

UPDATE test_suites 
SET project_id = (SELECT id FROM projects LIMIT 1)
WHERE project_id IS NULL;

UPDATE documents 
SET project_id = (SELECT id FROM projects LIMIT 1)
WHERE project_id IS NULL;

UPDATE important_links 
SET project_id = (SELECT id FROM projects LIMIT 1)
WHERE project_id IS NULL;

-- 4. Make project_id columns NOT NULL after setting defaults
ALTER TABLE test_cases ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE test_suites ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE important_links ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE platforms ALTER COLUMN project_id SET NOT NULL;

-- 5. Add foreign key constraints (drop first if they exist to avoid errors)
DO $$ 
BEGIN
    -- Drop existing constraints if they exist
    ALTER TABLE test_cases DROP CONSTRAINT IF EXISTS fk_test_cases_project_id;
    ALTER TABLE test_suites DROP CONSTRAINT IF EXISTS fk_test_suites_project_id;
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_project_id;
    ALTER TABLE important_links DROP CONSTRAINT IF EXISTS fk_important_links_project_id;
    ALTER TABLE platforms DROP CONSTRAINT IF EXISTS fk_platforms_project_id;
    
    -- Add new constraints
    ALTER TABLE test_cases ADD CONSTRAINT fk_test_cases_project_id FOREIGN KEY (project_id) REFERENCES projects(id);
    ALTER TABLE test_suites ADD CONSTRAINT fk_test_suites_project_id FOREIGN KEY (project_id) REFERENCES projects(id);
    ALTER TABLE documents ADD CONSTRAINT fk_documents_project_id FOREIGN KEY (project_id) REFERENCES projects(id);
    ALTER TABLE important_links ADD CONSTRAINT fk_important_links_project_id FOREIGN KEY (project_id) REFERENCES projects(id);
    ALTER TABLE platforms ADD CONSTRAINT fk_platforms_project_id FOREIGN KEY (project_id) REFERENCES projects(id);
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraints already exist, continue
        NULL;
END $$;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_project_id ON test_suites(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_important_links_project_id ON important_links(project_id);
CREATE INDEX IF NOT EXISTS idx_platforms_project_id ON platforms(project_id);

-- 7. Update the test_suites table to match expected structure
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS total_tests INTEGER DEFAULT 0;
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS passed_tests INTEGER DEFAULT 0;
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS failed_tests INTEGER DEFAULT 0;
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS pending_tests INTEGER DEFAULT 0;
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS owner TEXT DEFAULT 'Unknown';
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS test_case_ids TEXT[] DEFAULT '{}';

-- 8. Update the platforms table to match expected structure
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS description TEXT;

-- 9. Update the test_cases table to ensure all required columns exist
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS suite_id UUID;
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 10. Update the documents table to ensure all required columns exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS size INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by TEXT;

-- 11. Update the important_links table to ensure all required columns exist
ALTER TABLE important_links ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- 12. Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority);
CREATE INDEX IF NOT EXISTS idx_test_cases_assigned_tester ON test_cases(assigned_tester);
CREATE INDEX IF NOT EXISTS idx_test_suites_owner ON test_suites(owner);
CREATE INDEX IF NOT EXISTS idx_test_suites_is_active ON test_suites(is_active);

-- 13. Add triggers for updated_at columns if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 14. Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_test_cases_updated_at ON test_cases;
CREATE TRIGGER update_test_cases_updated_at 
    BEFORE UPDATE ON test_cases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_test_suites_updated_at ON test_suites;
CREATE TRIGGER update_test_suites_updated_at 
    BEFORE UPDATE ON test_suites 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. Verify the migration
SELECT 'Migration completed successfully' as status; 