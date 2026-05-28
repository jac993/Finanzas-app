export function getSupabasePublicConfig(): {
  url: string | undefined;
  anonKey: string | undefined;
  isConfigured: boolean;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}

export const SUPABASE_ENV_ERROR =
  "Faltan variables de Supabase en el despliegue. En Vercel ve a Settings → Environment Variables, agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY, y haz Redeploy sin caché.";
