import type { DatabaseAdapter } from "./storage-contract";
import { createId, isoNow } from "./entity-utils";

export const audit = async (
  db: DatabaseAdapter,
  actorType: "user" | "agent" | "system",
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata: unknown
) => auditStatement(db, actorType, actorId, action, entityType, entityId, metadata).run();

export const AUDIT_RETENTION_DAYS = 90;

export const pruneExpiredAuditEventsStatement = (
  db: DatabaseAdapter,
  cutoffIso = new Date(Date.now() - AUDIT_RETENTION_DAYS * 86_400_000).toISOString(),
  limit = 500,
) =>
  db
    .prepare(
      `DELETE FROM audit_events
       WHERE id IN (
         SELECT id
         FROM audit_events
         WHERE created_at < ?
         ORDER BY created_at ASC
         LIMIT ?
       )`
    )
    .bind(cutoffIso, limit);

export const auditStatement = (
  db: DatabaseAdapter,
  actorType: "user" | "agent" | "system",
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata: unknown
) =>
  db
    .prepare(
      `INSERT INTO audit_events (
        id, actor_type, actor_id, action, entity_type, entity_id, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(createId("audit"), actorType, actorId, action, entityType, entityId, JSON.stringify(metadata ?? {}), isoNow());
