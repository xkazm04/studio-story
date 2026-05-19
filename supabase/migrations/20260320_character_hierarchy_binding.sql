-- Add faction_hierarchy_node_id to characters table
-- Links characters directly to HierarchyEngine nodes for computed
-- chain-of-command, permission lookups, and succession queries.

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS faction_hierarchy_node_id UUID;

-- Index for reverse lookups (find character by node)
CREATE INDEX IF NOT EXISTS idx_characters_hierarchy_node
  ON characters (faction_hierarchy_node_id)
  WHERE faction_hierarchy_node_id IS NOT NULL;
