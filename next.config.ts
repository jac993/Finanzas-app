import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Evita que Next.js use la carpeta padre como raíz (hay otro package-lock.json arriba).
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
