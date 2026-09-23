-- Additive migration. Apply through Replit's supported migration/publish flow.
-- Existing publications and their pair snapshots are retained unchanged.
ALTER TABLE apartment_pair_publications
  ADD COLUMN IF NOT EXISTS pair_archives jsonb NOT NULL DEFAULT '[]'::jsonb;
