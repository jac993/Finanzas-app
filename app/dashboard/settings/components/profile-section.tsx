"use client";

import { useState, useTransition } from "react";
import type { UserProfile } from "@/lib/types";
import { updatePasswordAction, updateProfileAction } from "../actions";

export function ProfileSection({ profile }: { profile: UserProfile }) {
  const [isPending, startTransition] = useTransition();
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateProfileAction(formData);
      setProfileMessage(result.success ? "Perfil actualizado." : (result.message ?? "Error al guardar."));
    });
  }

  function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await updatePasswordAction(formData);
      if (!result.success) {
        setPasswordError(result.message ?? "No se pudo cambiar la contraseña.");
        return;
      }
      setPasswordMessage(result.message ?? "Contraseña actualizada.");
      form.reset();
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold tracking-tight">Perfil</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Actualiza tu nombre y contraseña de acceso.
      </p>

      <form onSubmit={handleProfileSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Nombre</span>
          <input
            name="name"
            type="text"
            defaultValue={profile.name ?? ""}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            type="email"
            value={profile.email}
            readOnly
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Guardar perfil
          </button>
          {profileMessage ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{profileMessage}</p> : null}
        </div>
      </form>

      <form onSubmit={handlePasswordSubmit} className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="text-sm font-semibold">Cambiar contraseña</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Nueva contraseña</span>
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Confirmar contraseña</span>
            <input
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Cambiar contraseña
        </button>
        {passwordError ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
        ) : null}
        {passwordMessage ? (
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{passwordMessage}</p>
        ) : null}
      </form>
    </section>
  );
}
