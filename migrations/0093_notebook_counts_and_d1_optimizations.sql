-- Denormalize active memo counts/timestamps on notebooks, add an active partial index,
-- and narrow high-frequency update/delete triggers to avoid D1 read/write amplification.
-- Keep every CREATE TRIGGER statement on a single physical line for remote D1 compatibility.
PRAGMA foreign_keys = ON;

ALTER TABLE notebooks ADD COLUMN memo_count INTEGER NOT NULL DEFAULT 0 CHECK (memo_count >= 0);
ALTER TABLE notebooks ADD COLUMN last_memo_updated_at TEXT;

CREATE INDEX IF NOT EXISTS idx_notebooks_workspace_active
  ON notebooks(workspace_id, is_deleted, parent_id, sort_order, name)
  WHERE is_deleted = 0;

-- Narrow existing notebook/backup triggers before backfilling so updating memo_count
-- and last_memo_updated_at never emits bogus mobile sync rows or backup revisions,
-- and permanently purging already-trashed rows does not spam backup_revision.
DROP TRIGGER IF EXISTS trg_mobile_sync_notebooks_update;
CREATE TRIGGER trg_mobile_sync_notebooks_update AFTER UPDATE OF id, workspace_id, parent_id, name, slug, icon, color, text_color, color_target, is_bold, icon_inverted, row_inverted, sort_order, is_deleted, created_at, updated_at, deleted_at ON notebooks BEGIN INSERT INTO mobile_sync_changes (workspace_id, entity_type, entity_id, operation) VALUES (NEW.workspace_id, 'notebook', NEW.id, (CASE WHEN NEW.is_deleted = 1 THEN 'delete' ELSE 'upsert' END)); END;

DROP TRIGGER IF EXISTS trg_backup_notebooks_update;
CREATE TRIGGER trg_backup_notebooks_update AFTER UPDATE OF id, workspace_id, parent_id, name, slug, icon, color, text_color, color_target, is_bold, icon_inverted, row_inverted, sort_order, is_deleted, created_at, updated_at, deleted_at ON notebooks WHEN OLD.is_deleted = 0 OR NEW.is_deleted = 0 BEGIN UPDATE workspaces SET backup_revision = backup_revision + 1 WHERE id IN (SELECT OLD.workspace_id UNION SELECT NEW.workspace_id); END;
DROP TRIGGER IF EXISTS trg_backup_notebooks_delete;
CREATE TRIGGER trg_backup_notebooks_delete BEFORE DELETE ON notebooks WHEN OLD.is_deleted = 0 BEGIN UPDATE workspaces SET backup_revision = backup_revision + 1 WHERE id IN (SELECT OLD.workspace_id); END;
DROP TRIGGER IF EXISTS trg_backup_memos_update;
CREATE TRIGGER trg_backup_memos_update AFTER UPDATE ON memos WHEN OLD.is_deleted = 0 OR NEW.is_deleted = 0 BEGIN UPDATE workspaces SET backup_revision = backup_revision + 1 WHERE id IN (SELECT OLD.workspace_id UNION SELECT NEW.workspace_id); END;
DROP TRIGGER IF EXISTS trg_backup_memos_delete;
CREATE TRIGGER trg_backup_memos_delete BEFORE DELETE ON memos WHEN OLD.is_deleted = 0 BEGIN UPDATE workspaces SET backup_revision = backup_revision + 1 WHERE id IN (SELECT OLD.workspace_id); END;
DROP TRIGGER IF EXISTS trg_backup_memo_contents_delete;
CREATE TRIGGER trg_backup_memo_contents_delete BEFORE DELETE ON memo_contents BEGIN UPDATE workspaces SET backup_revision = backup_revision + 1 WHERE id IN (SELECT workspace_id FROM memos WHERE id = OLD.memo_id AND is_deleted = 0); END;
DROP TRIGGER IF EXISTS trg_backup_memo_revisions_delete;
CREATE TRIGGER trg_backup_memo_revisions_delete BEFORE DELETE ON memo_revisions BEGIN UPDATE workspaces SET backup_revision = backup_revision + 1 WHERE id IN (SELECT workspace_id FROM memos WHERE id = OLD.memo_id AND is_deleted = 0); END;
DROP TRIGGER IF EXISTS trg_backup_resources_update;
CREATE TRIGGER trg_backup_resources_update AFTER UPDATE ON resources WHEN OLD.is_deleted = 0 OR NEW.is_deleted = 0 BEGIN UPDATE workspaces SET backup_revision = backup_revision + 1 WHERE id IN (SELECT workspace_id FROM memos WHERE id = OLD.memo_id UNION SELECT workspace_id FROM memos WHERE id = NEW.memo_id); END;
DROP TRIGGER IF EXISTS trg_backup_resources_delete;
CREATE TRIGGER trg_backup_resources_delete BEFORE DELETE ON resources WHEN OLD.is_deleted = 0 BEGIN UPDATE workspaces SET backup_revision = backup_revision + 1 WHERE id IN (SELECT workspace_id FROM memos WHERE id = OLD.memo_id); END;

-- Backfill denormalized notebook stats from active memos.
UPDATE notebooks
SET memo_count = (
      SELECT COUNT(*)
      FROM memos m
      WHERE m.notebook_id = notebooks.id
        AND m.workspace_id = notebooks.workspace_id
        AND m.is_deleted = 0
    ),
    last_memo_updated_at = (
      SELECT MAX(m.updated_at)
      FROM memos m
      WHERE m.notebook_id = notebooks.id
        AND m.workspace_id = notebooks.workspace_id
        AND m.is_deleted = 0
    );

-- Maintain notebooks.memo_count and notebooks.last_memo_updated_at transactionally.
CREATE TRIGGER trg_notebook_memo_stats_insert AFTER INSERT ON memos WHEN NEW.is_deleted = 0 BEGIN UPDATE notebooks SET memo_count = memo_count + 1, last_memo_updated_at = CASE WHEN last_memo_updated_at IS NULL OR NEW.updated_at > last_memo_updated_at THEN NEW.updated_at ELSE last_memo_updated_at END WHERE id = NEW.notebook_id AND workspace_id = NEW.workspace_id; END;
CREATE TRIGGER trg_notebook_memo_stats_delete AFTER DELETE ON memos WHEN OLD.is_deleted = 0 BEGIN UPDATE notebooks SET memo_count = MAX(0, memo_count - 1), last_memo_updated_at = CASE WHEN last_memo_updated_at IS NULL OR last_memo_updated_at = OLD.updated_at THEN (SELECT MAX(m.updated_at) FROM memos m WHERE m.notebook_id = notebooks.id AND m.workspace_id = notebooks.workspace_id AND m.is_deleted = 0) ELSE last_memo_updated_at END WHERE id = OLD.notebook_id AND workspace_id = OLD.workspace_id; END;
CREATE TRIGGER trg_notebook_memo_stats_soft_delete AFTER UPDATE OF is_deleted ON memos WHEN OLD.is_deleted = 0 AND NEW.is_deleted = 1 BEGIN UPDATE notebooks SET memo_count = MAX(0, memo_count - 1), last_memo_updated_at = CASE WHEN last_memo_updated_at IS NULL OR last_memo_updated_at = OLD.updated_at THEN (SELECT MAX(m.updated_at) FROM memos m WHERE m.notebook_id = notebooks.id AND m.workspace_id = notebooks.workspace_id AND m.is_deleted = 0) ELSE last_memo_updated_at END WHERE id = OLD.notebook_id AND workspace_id = OLD.workspace_id; END;
CREATE TRIGGER trg_notebook_memo_stats_restore AFTER UPDATE OF is_deleted ON memos WHEN OLD.is_deleted = 1 AND NEW.is_deleted = 0 BEGIN UPDATE notebooks SET memo_count = memo_count + 1, last_memo_updated_at = CASE WHEN last_memo_updated_at IS NULL OR NEW.updated_at > last_memo_updated_at THEN NEW.updated_at ELSE last_memo_updated_at END WHERE id = NEW.notebook_id AND workspace_id = NEW.workspace_id; END;
CREATE TRIGGER trg_notebook_memo_stats_move AFTER UPDATE OF workspace_id, notebook_id ON memos WHEN OLD.is_deleted = 0 AND NEW.is_deleted = 0 AND (OLD.notebook_id IS NOT NEW.notebook_id OR OLD.workspace_id IS NOT NEW.workspace_id) BEGIN UPDATE notebooks SET memo_count = MAX(0, memo_count - 1), last_memo_updated_at = CASE WHEN last_memo_updated_at IS NULL OR last_memo_updated_at = OLD.updated_at THEN (SELECT MAX(m.updated_at) FROM memos m WHERE m.notebook_id = notebooks.id AND m.workspace_id = notebooks.workspace_id AND m.is_deleted = 0) ELSE last_memo_updated_at END WHERE id = OLD.notebook_id AND workspace_id = OLD.workspace_id; UPDATE notebooks SET memo_count = memo_count + 1, last_memo_updated_at = CASE WHEN last_memo_updated_at IS NULL OR NEW.updated_at > last_memo_updated_at THEN NEW.updated_at ELSE last_memo_updated_at END WHERE id = NEW.notebook_id AND workspace_id = NEW.workspace_id; END;
CREATE TRIGGER trg_notebook_memo_stats_touch AFTER UPDATE OF updated_at ON memos WHEN OLD.is_deleted = 0 AND NEW.is_deleted = 0 AND OLD.notebook_id = NEW.notebook_id AND OLD.workspace_id = NEW.workspace_id AND OLD.updated_at IS NOT NEW.updated_at BEGIN UPDATE notebooks SET last_memo_updated_at = CASE WHEN last_memo_updated_at IS NULL OR NEW.updated_at > last_memo_updated_at THEN NEW.updated_at WHEN last_memo_updated_at = OLD.updated_at AND NEW.updated_at < OLD.updated_at THEN (SELECT MAX(m.updated_at) FROM memos m WHERE m.notebook_id = notebooks.id AND m.workspace_id = notebooks.workspace_id AND m.is_deleted = 0) ELSE last_memo_updated_at END WHERE id = NEW.notebook_id AND workspace_id = NEW.workspace_id AND (last_memo_updated_at IS NULL OR NEW.updated_at > last_memo_updated_at OR (last_memo_updated_at = OLD.updated_at AND NEW.updated_at < OLD.updated_at)); END;
CREATE TRIGGER trg_notebook_memo_stats_notebook_identity AFTER UPDATE OF id, workspace_id ON notebooks WHEN OLD.id IS NOT NEW.id OR OLD.workspace_id IS NOT NEW.workspace_id BEGIN UPDATE notebooks SET memo_count = (SELECT COUNT(*) FROM memos m WHERE m.notebook_id = NEW.id AND m.workspace_id = NEW.workspace_id AND m.is_deleted = 0), last_memo_updated_at = (SELECT MAX(m.updated_at) FROM memos m WHERE m.notebook_id = NEW.id AND m.workspace_id = NEW.workspace_id AND m.is_deleted = 0) WHERE id = NEW.id; END;
