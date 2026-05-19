"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-noche flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-5xl font-black text-white tracking-tighter">
              MI<span className="text-amber-400">SE</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm">Todo en su lugar</p>
        </div>

        {/* Card login */}
        <div className="bg-noche-light rounded-2xl p-6 border border-slate-700">
          <h1 className="text-white font-bold text-lg mb-5">Acceder</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="input bg-noche border-slate-600 text-white placeholder-slate-500
                           focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input bg-noche border-slate-600 text-white placeholder-slate-500
                           focus:ring-teal-500"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          MISE · Gestión integral de hostelería
        </p>
      </div>
    </div>
  );
}
