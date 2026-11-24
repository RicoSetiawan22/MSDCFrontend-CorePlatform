import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@modules": path.resolve(__dirname, "./src/modules"),
    },
  },
  server: {
    port: 5173,
    // Vite blokir Host header yang bukan localhost/IP secara default (proteksi
    // DNS rebinding) - domain publik yang dipakai reverse proxy produksi
    // (nginx di port 443) HARUS didaftarkan eksplisit di sini, kalau tidak
    // SEMUA request yang lewat domain itu ditolak 403 SEBELUM sempat kena
    // proxy /api di bawah - ini yang bikin request IoT (ESP32 kirim ke
    // https://msdc.jtv.co.id) gagal walau /api/* -> backend sudah benar.
    allowedHosts: ["msdc.jtv.co.id"],
    // Proxy /api requests to backend to avoid CORS issues during development.
    // Requests to /api/* from localhost:5173 get forwarded to localhost:8000/api/*.
    proxy: {
      "/api": {
        target: "https://msdc.jtv.co.id",
        changeOrigin: true,
        rewrite: (p) => p,
      },
    },
  },
});
