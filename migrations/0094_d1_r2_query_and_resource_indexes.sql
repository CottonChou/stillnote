-- Add partial feed indexes on memos, denormalize resources.workspace_id with an active
-- partial index, add a covering tag summary index, and index audit_events.created_at for
-- bounded retention pruning. Keep every CREATE TRIGGER on one line for remote D1 compatibility.
PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_memos_workspace_active_feed
  ON memos(workspace_id, is_deleted, is_pinned DESC, updated_at DESC, id DESC)
  WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_memos_workspace_notebook_active_feed
  ON memos(workspace_id, notebook_id, is_deleted, is_pinned DESC, updated_at DESC, id DESC)
  WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_memos_workspace_trash_feed
  ON memos(workspace_id, is_deleted, deleted_at DESC, id DESC)
  WHERE is_deleted = 1;

CREATE INDEX IF NOT EXISTS idx_memo_tags_workspace_summary
  ON memo_tags(workspace_id, normalized_name, name, memo_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_created_at
  ON audit_events(created_at);

ALTER TABLE resources ADD COLUMN workspace_id TEXT;

-- Narrow trg_backup_resources_update before backfilling workspace_id so backfilling or
-- trigger-synced workspace_id never causes spurious backup_revision increments.
DROP TRIGGER IF EXISTS trg_backup_resources_update;
CREATE TRIGGER trg_backup_resources_update AFTER UPDATE OF id, memo_id, original_memo_id, bucket_name, object_key, storage_config_id, kind, mime_type, filename, byte_size, sha256, width, height, metadata_json, is_deleted, created_at, updated_at, deleted_at ON resources WHEN OLD.is_deleted = 0 OR NEW.is_deleted = 0 BEGIN UPDATE workspaces SET backup_revision = backup_revision + 1 WHERE id IN (SELECT workspace_id FROM memos WHERE id = OLD.memo_id UNION SELECT workspace_id FROM memos WHERE id = NEW.memo_id); END;

UPDATE resources
SET workspace_id = (
  SELECT m.workspace_id
  FROM memos m
  WHERE m.id = resources.memo_id
)
WHERE workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_resources_workspace_active_created
  ON resources(workspace_id, is_deleted, created_at DESC, id DESC)
  WHERE is_deleted = 0;

CREATE TRIGGER trg_resources_sync_workspace_insert AFTER INSERT ON resources WHEN NEW.workspace_id IS NULL BEGIN UPDATE resources SET workspace_id = (SELECT m.workspace_id FROM memos m WHERE m.id = NEW.memo_id) WHERE id = NEW.id; END;
CREATE TRIGGER trg_resources_sync_workspace_memo_move AFTER UPDATE OF memo_id ON resources WHEN OLD.memo_id IS NOT NEW.memo_id BEGIN UPDATE resources SET workspace_id = (SELECT m.workspace_id FROM memos m WHERE m.id = NEW.memo_id) WHERE id = NEW.id; END;
CREATE TRIGGER trg_resources_sync_workspace_from_memo AFTER UPDATE OF workspace_id ON memos WHEN OLD.workspace_id IS NOT NEW.workspace_id BEGIN UPDATE resources SET workspace_id = NEW.workspace_id WHERE memo_id = NEW.id; END;
