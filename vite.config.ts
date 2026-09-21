import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* VITE_BASE lets the GitHub Pages workflow build for the /<repo>/ subpath; Vercel and local dev keep the root. */
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
});
