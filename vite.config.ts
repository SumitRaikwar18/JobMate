// JobMate Vite & TanStack Start Configuration
// Configures TanStack Start SSR entry, Tailwind CSS, TypeScript aliases, and build pipeline.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
