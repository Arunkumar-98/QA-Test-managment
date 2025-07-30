-- Fix Status History RLS Policies
-- This script fixes the RLS policies for the status_history table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view status history for their test cases" ON status_history;
DROP POLICY IF EXISTS "Users can insert status history for their test cases" ON status_history;

-- Create updated RLS policies for status_history
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

-- Update the log_status_change function to handle errors gracefully
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