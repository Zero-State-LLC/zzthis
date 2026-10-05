// The one audit writer (spec 005 T004). Every state change puts this
// statement in the same D1 batch as the change, so a failed audit insert
// rolls the change back (FR-031, spec 002 FR-018).

export type AuditResult = "ok" | "not-found" | "denied";

export interface AuditEvent {
  readonly actorId: string | null;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly result: AuditResult;
  readonly at: string;
}

// An EXISTS subquery that holds only when the batch's guard took effect,
// such as "SELECT 1 FROM codes WHERE id = ? AND write_id = ?".
export interface Gate {
  readonly sql: string;
  readonly params: readonly (string | number | null)[];
}

const COLUMNS =
  "id, actor_id, action, target_type, target_id, result, created_at";

export function auditStatement(
  db: D1Database,
  event: AuditEvent,
  gate?: Gate,
): D1PreparedStatement {
  const values = [
    crypto.randomUUID(),
    event.actorId,
    event.action,
    event.targetType,
    event.targetId,
    event.result,
    event.at,
  ];
  if (gate === undefined) {
    return db
      .prepare(
        `INSERT INTO audit_events (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(...values);
  }
  return db
    .prepare(
      `INSERT INTO audit_events (${COLUMNS}) SELECT ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (${gate.sql})`,
    )
    .bind(...values, ...gate.params);
}
