import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  esbuild: {
    target: "esnext",
  },
  test: {
    poolOptions: {
      workers: {
        singleWorker: true,
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
      },
    },
    deps: {
      inline: ["@cloudflare/vitest-pool-workers"],
    },
  },
});
