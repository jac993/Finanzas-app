export function getSupabasePublicConfig(): {
  url: string | undefined;
  anonKey: string | undefined;
  isConfigured: boolean;
  configError: string | null;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;

  if (!url && !anonKey) {
    return {
      url,
      anonKey,
      isConfigured: false,
      configError:
        "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel. Agrégalas en Settings → Environment Variables y haz Redeploy sin caché.",
    };
  }

  if (!url) {
    return {
      url,
      anonKey,
      isConfigured: false,
      configError:
        "Falta NEXT_PUBLIC_SUPABASE_URL en Vercel. Copia la URL de Supabase (Project Settings → API) y haz Redeploy sin caché.",
    };
  }

  if (!anonKey) {
    return {
      url,
      anonKey,
      isConfigured: false,
      configError:
        "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel. Copia la clave publishable de Supabase y haz Redeploy sin caché.",
    };
  }

  if (!url.includes(".supabase.co")) {
    return {
      url,
      anonKey,
      isConfigured: false,
      configError:
        "NEXT_PUBLIC_SUPABASE_URL está mal configurada en Vercel. Debe ser la URL de Supabase (ej: https://tu-proyecto.supabase.co), NO la URL de Vercel.",
    };
  }

  return { url, anonKey, isConfigured: true, configError: null };
}

export const SUPABASE_ENV_ERROR =
  "Faltan variables de Supabase en el despliegue. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.";
