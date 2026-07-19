import { defineConfig } from "nitro";
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

export default defineConfig({
  preset: "vercel",
  serverAssets: [
    {
      baseName: "data",
      dir: "./data",
    },
  ],
  hooks: {
    "compiled": (nitro) => {
      const src = resolve("data", "sacredspace.db");
      if (!existsSync(src)) return;
      const dest = resolve(nitro.options.output.serverDir, "data", "sacredspace.db");
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
    },
  },
});
