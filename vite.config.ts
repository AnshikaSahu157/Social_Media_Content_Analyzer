import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [
        "./client",
        "./shared",
        "./node_modules/pdfjs-dist",
        "./node_modules/tesseract.js",
        "./node_modules/tesseract.js-core",
        "./node_modules/.pnpm",
      ],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // only for `vite dev`
    configureServer(server) {
      import("./server").then(({ createServer }) => {
        const app = createServer();
        server.middlewares.use(app);
      });
    },
  };
}
