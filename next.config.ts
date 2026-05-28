import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Asegura que Vercel incluya estas variables en el bundle del cliente al compilar.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Evita que Next.js use la carpeta padre como raíz (hay otro package-lock.json arriba).
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
