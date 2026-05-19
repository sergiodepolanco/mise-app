"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, User } from "lucide-react";

export default function OnboardingEmpleadoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");

  async function guardarDatos() {
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    setLoading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      await supabase.from("perfiles").update({
        nombre: nombre.trim(),
        apellidos: apellidos.trim() || null,
        telefono: telefono.trim() || null,
        primer_login: false,
        onboarding_completado: true,
      }).eq("id", user.id);
      setPaso(2);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-noche flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-black text-white tracking-tighter">MI<span className="text-amber-400">SE</span></span>
        </div>

        {paso === 1 && (
          <div className="bg-noche-light rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-900/50 rounded-xl flex items-center justify-center">
                <User size={20} className="text-teal-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Bienvenido a MISE</h2>
                <p className="text-slate-400 text-sm">Confirma tus datos</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Nombre *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre"
                  className="input bg-noche border-slate-600 text-white placeholder-slate-500 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Apellidos</label>
                <input value={apellidos} onChange={e => setApellidos(e.target.value)} placeholder="Tus apellidos"
                  className="input bg-noche border-slate-600 text-white placeholder-slate-500 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Teléfono</label>
                <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+34 600 000 000" type="tel"
                  className="input bg-noche border-slate-600 text-white placeholder-slate-500 focus:ring-teal-500" />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2 mt-4">{error}</p>}
            <button onClick={guardarDatos} disabled={loading}
              className="w-full btn-primary justify-center py-3 mt-6 disabled:opacity-50">
              {loading ? "Guardando..." : "Continuar"} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {paso === 2 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-3">¡Bienvenido!</h1>
            <p className="text-slate-400 mb-8">Tu perfil está listo. Tu responsable te asignará los accesos correspondientes.</p>
            <button onClick={() => { router.push("/dashboard"); router.refresh(); }}
              className="btn-primary w-full justify-center py-3">
              Entrar <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
