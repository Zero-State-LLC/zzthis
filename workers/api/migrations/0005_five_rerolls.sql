-- Five re-rolls (D-2026-10-13-02, RM-125, spec 005 FR-006): a new plain
-- code starts with rerolls_remaining 5, so the column's CHECK widens from
-- 0..3 to 0..5. SQLite cannot change a CHECK in place. A rebuild of codes
-- would have to name every column, so it would depend on which other
-- migrations ran first (spec 005 gives 0004 to idle expiry, RM-127, which
-- adds a codes column). Instead the column is swapped: the old one is
-- renamed, a new one with the wider CHECK takes every row's value, and the
-- old one is dropped, its CHECK (a column constraint) with it. Every
-- statement in the Worker names its columns, so the column's new place at
-- the end of the table changes nothing. The DEFAULT is only there because SQLite needs one to add a
-- NOT NULL column; every insert sets the value. Forward-only.
ALTER TABLE codes RENAME COLUMN rerolls_remaining TO rerolls_remaining_v1;

ALTER TABLE codes ADD COLUMN rerolls_remaining INTEGER NOT NULL DEFAULT 0 CHECK (rerolls_remaining BETWEEN 0 AND 5);

UPDATE codes SET rerolls_remaining = rerolls_remaining_v1;

ALTER TABLE codes DROP COLUMN rerolls_remaining_v1;
