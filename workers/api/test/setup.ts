import { applyD1Migrations, reset } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeEach } from "vitest";

// Every test starts from an empty database, limiter, and cache: reset()
// clears every binding, so the migrations run again.
beforeEach(async () => {
  await reset();
  await applyD1Migrations(env.ZZ_DB, env.TEST_MIGRATIONS);
});
