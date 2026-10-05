// FR-031: a D1 batch rolls back only on a statement error, so a guarded
// write is decided from its statement's meta.changes.
export function changes(results: readonly D1Result[], index = 0): number {
  return (results[index] as D1Result).meta.changes;
}
