-- Complete Database Setup for QA Management System
-- Run this manually in your Supabase SQL Editor to ensure all tables and features work properly

-- ===============
-- NOTES TABLE
-- ===============
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  tags text[] DEFAULT array[]::text[],
  color text DEFAULT '',
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "notes_select" ON public.notes;
DROP POLICY IF EXISTS "notes_insert" ON public.notes;
DROP POLICY IF EXISTS "notes_update" ON public.notes;
DROP POLICY IF EXISTS "notes_delete" ON public.notes;

-- Create RLS policies
CREATE POLICY "notes_select" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notes_insert" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes_update" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notes_delete" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON public.notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON public.notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON public.notes USING GIN(tags);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_notes_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trg_update_notes_updated_at ON public.notes;
CREATE TRIGGER trg_update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_notes_updated_at();

-- Grant permissions to authenticated users
GRANT ALL ON public.notes TO authenticated;

-- ===============
-- CUSTOM COLUMNS TABLE
-- ===============
CREATE TABLE IF NOT EXISTS public.custom_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  label text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'number', 'select', 'boolean', 'date', 'email', 'url')),
  required boolean DEFAULT false,
  default_value text,
  options text[] DEFAULT array[]::text[],
  color varchar(7) DEFAULT '#3b82f6',
  option_colors jsonb DEFAULT '{}'::jsonb,
  visible boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_columns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "custom_columns_select" ON public.custom_columns;
DROP POLICY IF EXISTS "custom_columns_insert" ON public.custom_columns;
DROP POLICY IF EXISTS "custom_columns_update" ON public.custom_columns;
DROP POLICY IF EXISTS "custom_columns_delete" ON public.custom_columns;

-- Create RLS policies
CREATE POLICY "custom_columns_select" ON public.custom_columns
  FOR SELECT USING (true);

CREATE POLICY "custom_columns_insert" ON public.custom_columns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "custom_columns_update" ON public.custom_columns
  FOR UPDATE USING (true);

CREATE POLICY "custom_columns_delete" ON public.custom_columns
  FOR DELETE USING (true);

-- Create unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'custom_columns_project_id_name_key'
  ) THEN
    ALTER TABLE public.custom_columns ADD CONSTRAINT custom_columns_project_id_name_key 
      UNIQUE (project_id, name);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_columns_project_id ON public.custom_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_columns_name ON public.custom_columns(name);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_custom_columns_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trg_update_custom_columns_updated_at ON public.custom_columns;
CREATE TRIGGER trg_update_custom_columns_updated_at
  BEFORE UPDATE ON public.custom_columns
  FOR EACH ROW EXECUTE FUNCTION public.update_custom_columns_updated_at();

-- Grant permissions
GRANT ALL ON public.custom_columns TO authenticated;

-- ===============
-- DOCUMENTS TABLE
-- ===============
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('requirement', 'specification', 'test-plan', 'report')),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_update" ON public.documents;
DROP POLICY IF EXISTS "documents_delete" ON public.documents;

-- Create RLS policies
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);

-- Grant permissions
GRANT ALL ON public.documents TO authenticated;

-- ===============
-- IMPORTANT LINKS TABLE
-- ===============
CREATE TABLE IF NOT EXISTS public.important_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.important_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "important_links_select" ON public.important_links;
DROP POLICY IF EXISTS "important_links_insert" ON public.important_links;
DROP POLICY IF EXISTS "important_links_update" ON public.important_links;
DROP POLICY IF EXISTS "important_links_delete" ON public.important_links;

-- Create RLS policies
CREATE POLICY "important_links_select" ON public.important_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "important_links_insert" ON public.important_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "important_links_update" ON public.important_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "important_links_delete" ON public.important_links
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_important_links_project_id ON public.important_links(project_id);
CREATE INDEX IF NOT EXISTS idx_important_links_category ON public.important_links(category);

-- Grant permissions
GRANT ALL ON public.important_links TO authenticated;

-- =====================================
-- MULTI-USER PROJECT MEMBERSHIPS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS public.project_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','admin','editor','viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  invited_by uuid,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security for memberships
ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS pm_select ON public.project_memberships;
DROP POLICY IF EXISTS pm_insert ON public.project_memberships;
DROP POLICY IF EXISTS pm_update ON public.project_memberships;
DROP POLICY IF EXISTS pm_delete ON public.project_memberships;

-- Create RLS policies for memberships
CREATE POLICY pm_select ON public.project_memberships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = invited_by);

CREATE POLICY pm_insert ON public.project_memberships
  FOR INSERT WITH CHECK (true);

CREATE POLICY pm_update ON public.project_memberships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = invited_by);

CREATE POLICY pm_delete ON public.project_memberships
  FOR DELETE USING (auth.uid() = invited_by);

-- Create indexes for memberships
CREATE INDEX IF NOT EXISTS idx_project_memberships_project_id ON public.project_memberships(project_id);
CREATE INDEX IF NOT EXISTS idx_project_memberships_user_id ON public.project_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_project_memberships_status ON public.project_memberships(status);

-- Function to automatically update updated_at timestamp for memberships
CREATE OR REPLACE FUNCTION public.update_pm_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for memberships updated_at
DROP TRIGGER IF EXISTS trg_update_pm_updated ON public.project_memberships;
CREATE TRIGGER trg_update_pm_updated
  BEFORE UPDATE ON public.project_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_pm_updated_at();

-- Grant permissions
GRANT ALL ON public.project_memberships TO authenticated;

-- =========================
-- HELPER / PERMISSION RPCs
-- =========================
DROP FUNCTION IF EXISTS public.get_user_projects(uuid);

CREATE OR REPLACE FUNCTION public.has_project_permission(project_uuid uuid, user_uuid uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE r text;
BEGIN
  SELECT role INTO r
  FROM public.project_memberships
  WHERE project_id = project_uuid AND user_id = user_uuid AND status = 'accepted'
  LIMIT 1;

  IF r IS NULL THEN RETURN false; END IF;
  IF required_role = 'viewer' THEN RETURN true; END IF;
  IF required_role = 'editor' THEN RETURN r IN ('owner','admin','editor'); END IF;
  IF required_role = 'admin'  THEN RETURN r IN ('owner','admin'); END IF;
  IF required_role = 'owner'  THEN RETURN r = 'owner'; END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_projects(user_uuid uuid)
RETURNS TABLE(
  project_id uuid,
  project_name text,
  project_description text,
  user_role text,
  is_owner boolean,
  member_count int,
  created_at timestamptz
)
LANGUAGE sql
AS $$
  SELECT p.id, p.name, p.description,
         pm.role, (pm.role = 'owner') as is_owner,
         (SELECT count(*) FROM public.project_memberships pm2 WHERE pm2.project_id = p.id AND pm2.status = 'accepted') as member_count,
         p.created_at
  FROM public.projects p
  JOIN public.project_memberships pm ON pm.project_id = p.id AND pm.user_id = user_uuid AND pm.status = 'accepted';
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.has_project_permission(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_projects(uuid) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.notes IS 'User notes for projects with RLS enabled';
COMMENT ON COLUMN public.notes.tags IS 'Array of tags for categorizing notes';
COMMENT ON COLUMN public.notes.color IS 'Color theme for the note (blue, green, yellow, red, purple, pink)';
COMMENT ON COLUMN public.notes.is_pinned IS 'Whether the note is pinned to the top of the list';

COMMENT ON TABLE public.custom_columns IS 'Custom columns for test cases with dynamic field types';
COMMENT ON COLUMN public.custom_columns.type IS 'Field type: text, number, select, boolean, date, email, url';
COMMENT ON COLUMN public.custom_columns.options IS 'Array of options for select type fields';
COMMENT ON COLUMN public.custom_columns.option_colors IS 'JSON object mapping option values to colors';

COMMENT ON TABLE public.documents IS 'Project documents with different types';
COMMENT ON COLUMN public.documents.type IS 'Document type: requirement, specification, test-plan, report';

COMMENT ON TABLE public.important_links IS 'Important links for projects';
COMMENT ON COLUMN public.important_links.category IS 'Link category for organization';

-- Success message
SELECT 'Complete database setup finished successfully! All tables and features are now ready.' as status;
