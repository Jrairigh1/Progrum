import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://firestore.googleapis.com wss://firestore.googleapis.com https://firebaseinstallations.googleapis.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "worker-src 'none'",
].join("; ");

function pagesCsp(): Plugin {
  return {
    name: "progrum-csp",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (ctx.server) return html;
        const tag = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`;
        return html.replace("<head>", `<head>\n    ${tag}`);
      },
    },
  };
}

export default defineConfig({
  // Relative URLs so GitHub Pages can serve the repo at /Progrum/ or any other casing.
  base: "./",
  plugins: [react(), pagesCsp()],
  build: {
    sourcemap: false,
  },
});
