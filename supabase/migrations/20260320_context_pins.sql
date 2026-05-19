-- Context Pins: persistent story rules that auto-inject into every AI generation.
-- Pin types: world_rule, character_constraint, tone_directive, plot_boundary
-- Scopes: project (global), act (specific act), character (specific character)

CREATE TABLE IF NOT EXISTS context_pins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL,
  pin_type        TEXT NOT NULL
                  CHECK (pin_type IN ('world_rule', 'character_constraint', 'tone_directive', 'plot_boundary')),
  label           TEXT NOT NULL,
  content         TEXT NOT NULL,
  scope           TEXT NOT NULL DEFAULT 'project'
                  CHECK (scope IN ('project', 'act', 'character')),
  scope_target_id UUID,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_context_pins_project
  ON context_pins (project_id);

CREATE INDEX IF NOT EXISTS idx_context_pins_project_enabled
  ON context_pins (project_id, enabled)
  WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_context_pins_scope_target
  ON context_pins (scope, scope_target_id)
  WHERE scope_target_id IS NOT NULL;
