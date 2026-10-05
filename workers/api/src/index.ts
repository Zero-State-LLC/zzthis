import { productionDeps } from "./deps.ts";
import { createWorker } from "./worker.ts";

// The Durable Object class must be exported from the main module.
export { Limiter } from "./limits/limiter.ts";

export default createWorker(productionDeps());
