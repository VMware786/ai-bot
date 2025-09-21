// vite.config.ts
import { defineConfig, type ViteDevServer } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import UnoCSS from "unocss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { vitePlugin as remix } from "@remix-run/dev";
import { vercelPreset } from "@vercel/remix/vite";
import { installGlobals } from "@remix-run/node";
import { optimizeCssModules } from "vite-plugin-optimize-css-modules"; // <-- static import

installGlobals();

export default defineConfig((config) => {
  return {
    build: { target: "esnext" },
    plugins: [
      nodePolyfills({ include: ["path", "buffer"] }),

      // Use Vercel's Remix preset (drop Cloudflare dev proxy)
      remix({
        presets: [vercelPreset()],
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
        },
      }),

      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),

      // Only enable CSS modules optimization in production
      config.mode === "production" ? optimizeCssModules({ apply: "build" }) : undefined,
    ].filter(Boolean),
  };
});

function chrome129IssuePlugin() {
  return {
    name: "chrome129IssuePlugin",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers["user-agent"]?.match(/Chrom(e|ium)\/([0-9]+)\./);
        if (raw) {
          const version = parseInt(raw[2], 10);
          if (version === 129) {
            res.setHeader("content-type", "text/html");
            res.end(
              '<body><h1>Please use Chrome Canary for testing.</h1><p>Chrome 129 has an issue with JavaScript modules & Vite local development, see <a href="https://github.com/stackblitz/bolt.new/issues/86#issuecomment-2395519258">for more information.</a></p><p><b>Note:</b> This only impacts <u>local development</u>. `pnpm run build` and `pnpm run start` will work fine in this browser.</p></body>'
            );
            return;
          }
        }
        next();
      });
    },
  };
}
