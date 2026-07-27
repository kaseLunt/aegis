// W5 S3 packaging (charter §4). Standalone config importing only "vite" — never the async
// Workers vite.config.ts. Single-file output (inlineDynamicImports) => one spine instance
// => the WeakSet provenance brands hold (D-6bedc848:55-66).
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "bin/aegis.ts",
    target: "node22",
    outDir: "dist/cli",
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: "aegis.js",
        inlineDynamicImports: true,
        banner: "#!/usr/bin/env node",
      },
    },
  },
  ssr: {
    // Bundle everything; only node builtins stay external.
    noExternal: true,
  },
});
