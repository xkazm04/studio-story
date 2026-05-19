-- Story Time-Travel: Version control for narrative data
-- Creates commit log and branch management tables

-- Branches: named pointers (like git branches)
CREATE TABLE IF NOT EXISTS story_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_branch_id UUID REFERENCES story_branches(id) ON DELETE SET NULL,
  fork_commit_id UUID, -- filled after story_commits exists
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

-- Commits: immutable log of every mutation
CREATE TABLE IF NOT EXISTS story_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES story_branches(id) ON DELETE CASCADE,
  parent_commit_id UUID REFERENCES story_commits(id),
  entity_table TEXT NOT NULL,        -- 'characters', 'scenes', 'beats', etc.
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  before_snapshot JSONB,             -- null for inserts
  after_snapshot JSONB,              -- null for deletes
  diff JSONB,                        -- computed changed fields only
  message TEXT,                      -- auto-generated or user-provided
  metadata JSONB DEFAULT '{}',       -- tool name, extra context
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now add the FK on story_branches.fork_commit_id
ALTER TABLE story_branches
  ADD CONSTRAINT fk_fork_commit
  FOREIGN KEY (fork_commit_id) REFERENCES story_commits(id) ON DELETE SET NULL;

-- Indexes for common queries
CREATE INDEX idx_story_commits_project ON story_commits(project_id);
CREATE INDEX idx_story_commits_branch ON story_commits(branch_id);
CREATE INDEX idx_story_commits_entity ON story_commits(entity_table, entity_id);
CREATE INDEX idx_story_commits_created ON story_commits(created_at DESC);
CREATE INDEX idx_story_branches_project ON story_branches(project_id);

-- Auto-update updated_at on branches
CREATE OR REPLACE FUNCTION update_story_branch_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_story_branch_updated
  BEFORE UPDATE ON story_branches
  FOR EACH ROW
  EXECUTE FUNCTION update_story_branch_timestamp();
