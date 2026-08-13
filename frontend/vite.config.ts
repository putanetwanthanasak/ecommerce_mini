import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// No dev proxy: the API base URL comes from VITE_API_URL so the same build
// talks to localhost in dev and a real host later. The backend already sends
// permissive CORS headers, so the browser calls it cross-origin directly.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
