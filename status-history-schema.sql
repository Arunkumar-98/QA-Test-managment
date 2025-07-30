-- Status History Tracking System for QA Test Management

-- Create status_history table to track all status changes
CREATE TABLE IF NOT EXISTS status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  old_status TEXT CHECK (old_status IN ('Pending', 'Pass', 'Fail', 'In Progress', 'Blocked')),
  new_status TEXT CHECK (new_status IN ('Pending', 'Pass', 'Fail', 'In Progress', 'Blocked')) NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  reason TEXT CHECK (reason IN ('manual_update', 'automation_run', 'bulk_update', 'import', 'system')),
  metadata JSONB -- Store additional context like automation results, test duration, etc.
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_status_history_test_case_id ON status_history(test_case_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_status_history_new_status ON status_history(new_status);

-- Enable Row Level Security
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for status_history
CREATE POLICY "Users can view status history for their test cases" ON status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM test_cases 
            WHERE test_cases.id = status_history.test_case_id 
            AND (test_cases.user_id = auth.uid() OR test_cases.user_id IS NULL)
        )
    );

CREATE POLICY "Users can insert status history for their test cases" ON status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM test_cases 
            WHERE test_cases.id = status_history.test_case_id 
            AND (test_cases.user_id = auth.uid() OR test_cases.user_id IS NULL)
        )
    );

-- Create function to automatically log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO status_history (
            test_case_id,
            old_status,
            new_status,
            changed_by,
            notes,
            reason,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(auth.jwt() ->> 'email', 'system'),
            NEW.notes,
            'manual_update',
            jsonb_build_object(
                'updated_at', NEW.updated_at,
                'assigned_tester', NEW.assigned_tester,
                'execution_date', NEW.execution_date
            )
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If there's an error (like RLS violation), just return NEW without logging
        -- This prevents the main update from failing
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log status changes
DROP TRIGGER IF EXISTS trigger_log_status_change ON test_cases;
CREATE TRIGGER trigger_log_status_change
    AFTER UPDATE ON test_cases
    FOR EACH ROW
    EXECUTE FUNCTION log_status_change();

-- Create function to get status history for a test case
CREATE OR REPLACE FUNCTION get_test_case_status_history(test_case_uuid UUID)
RETURNS TABLE (
    id UUID,
    old_status TEXT,
    new_status TEXT,
    changed_by TEXT,
    changed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    reason TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sh.id,
        sh.old_status,
        sh.new_status,
        sh.changed_by,
        sh.changed_at,
        sh.notes,
        sh.reason,
        sh.metadata
    FROM status_history sh
    WHERE sh.test_case_id = test_case_uuid
    ORDER BY sh.changed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get status change statistics
CREATE OR REPLACE FUNCTION get_status_change_stats(
    project_uuid UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    status TEXT,
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH status_counts AS (
        SELECT 
            sh.new_status,
            COUNT(*) as count
        FROM status_history sh
        JOIN test_cases tc ON sh.test_case_id = tc.id
        WHERE (project_uuid IS NULL OR tc.project_id = project_uuid)
        AND (start_date IS NULL OR sh.changed_at >= start_date)
        AND (end_date IS NULL OR sh.changed_at <= end_date)
        GROUP BY sh.new_status
    ),
    total_changes AS (
        SELECT SUM(count) as total
        FROM status_counts
    )
    SELECT 
        sc.new_status as status,
        sc.count,
        ROUND((sc.count::NUMERIC / tc.total::NUMERIC) * 100, 2) as percentage
    FROM status_counts sc
    CROSS JOIN total_changes tc
    ORDER BY sc.count DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (optional)
-- INSERT INTO status_history (test_case_id, old_status, new_status, changed_by, notes, reason)
-- SELECT 
--     tc.id,
--     'Pending',
--     tc.status,
--     'system',
--     'Initial status from test case creation',
--     'system'
-- FROM test_cases tc
-- WHERE tc.status != 'Pending'; 