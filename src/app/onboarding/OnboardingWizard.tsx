"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Check, ChevronRight, ChevronLeft, Plus, Trash2,
  Store, MapPin, LayoutGrid, Users, UtensilsCrossed, ArrowRight
} from "lucide-react";

type Paso = 1 | 2 | 3 | 4 | 5;

interface AreaConfig {
  nombre: string;
  color: string;
  seleccionada: boolean;
  custom?: boolean;
}

interface Invitado {
  email: string;
  rol: "encargado" | "empleado";
}

interface Props {
  localId?: string;
  localNombre?: string;
  localTipo?: string;
  localDireccion?: string;
  localCiudad?: string;
  localProvincia?: string;
  localCP?: string;
  localTelefono?: string;
  localEmail?: string;
}

const TIPOS_LOCAL = [
  "Restaurante", "Bar", "Cafetería", "Pub", "Chiringuito",
  "Food Truck", "Dark Kitchen", "Catering", "Otro",
];

const AREAS_BASE: AreaConfig[] = [
  { nombre: "Barra",    color: "#F59E0B", seleccionada: true  },
  { nombre: "Cocina",   color: "#EF4444", seleccionada: true  },
  { nombre: "Delivery", color: "#3B82F6", seleccionada: false },
  { nombre: "Común",    color: "#64748B", seleccionada: true  },
];

const CATS_BASE = ["Entrantes", "Principales", "Postres", "Bebidas"];

const PASOS_INFO = [
  { label: "Tu local",   icon: Store          },
  { label: "Inventario", icon: LayoutGrid     },
  { label: "Equipo",     icon: Users          },
  { label: "Carta",      icon: UtensilsCrossed },
];

export default function OnboardingWizard(props: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [paso, setPaso] = useState<Paso>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre:        props.localNombre    ?? "",
    tipo:          props.localTipo      ?? "",
    direccion:     props.localDireccion ?? "",
    ciudad:        props.localCiudad    ?? "",
    provincia:     props.localProvincia ?? "",
    codigo_postal: props.localCP        ?? "",
    telefono:      props.localTelefono  ?? "",
    email:         props.localEmail     ?? "",
  });

  const [areas, setAreas] = useState<AreaConfig[]>(AREAS_BASE);
  const [nuevaArea, setNuevaArea] = useState("");
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoRol, setNuevoRol] = useState<"encargado" | "empleado">("empleado");
  const [categorias, setCategorias] = useState<string[]>(CATS_BASE);
  const [nuevaCat, setNuevaCat] = useState("");

  async function getLocalId(): Promise<string | null> {
    if (props.localId) return props.localId;
    const { data } = await supabase.from("perfiles").select("local_id").single();
    return data?.local_id ?? null;
  }

  function err(msg: string) { setError(msg); setLoading(false); }

  async function guardarLocal() {
    if (!form.nombre.trim() || !form.tipo) return err("Nombre y tipo son obligatorios");
    setLoading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const localId = await getLocalId();
      if (localId) {
        const { error: e } = await supabase.from("locales").update(form).eq("id", localId);
        if (e) throw e;
      } else {
        const { data: nuevo, error: e } = await supabase.from("locales").insert(form).select("id").single();
        if (e) throw e;
        await supabase.from("user_locales").insert({ user_id: user.id, local_id: nuevo.id, rol: "admin" });
        await supabase.from("perfiles").update({ local_id: nuevo.id, primer_login: false }).eq("id", user.id);
      }
      setPaso(2);
    } catch (e: any) { err(e.message); }
    setLoading(false);
  }

  async function guardarAreas() {
    setLoading(true); setError("");
    try {
      const localId = await getLocalId();
      if (!localId) throw new Error("Configura primero los datos del local");
      const seleccionadas = areas.filter(a => a.seleccionada);
      if (seleccionadas.length === 0) { setPaso(3); setLoading(false); return; }
      await supabase.from("areas_inventario").delete().eq("local_id", localId);
      await supabase.from("areas_inventario").insert(
        seleccionadas.map((a, i) => ({ local_id: localId, nombre: a.nombre, color: a.color, orden: i }))
      );
      await supabase.from("locales").update({ onboarding_paso_actual: 3 }).eq("id", localId);
      setPaso(3);
    } catch (e: any) { err(e.message); }
    setLoading(false);
  }

  async function guardarEquipo() {
    setLoading(true); setError("");
    const localId = await getLocalId();
    if (localId) await supabase.from("locales").update({ onboarding_paso_actual: 4 }).eq("id", localId);
    setPaso(4);
    setLoading(false);
  }

  async function finalizarOnboarding() {
    setLoading(true); setError("");
    try {
      const localId = await getLocalId();
      if (localId && categorias.length > 0) {
        await supabase.from("categorias_carta").upsert(
          categorias.map((nombre, i) => ({ local_id: localId, nombre, orden: i, activa: true })),
          { onConflict: "local_id,nombre" }
        );
        await supabase.from("locales").update({ onboarding_completado: true, onboarding_paso_actual: 5 }).eq("id", localId);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("perfiles").update({ onboarding_completado: true, primer_login: false }).eq("id", user.id);
      setPaso(5);
    } catch (e: any) { err(e.message); }
    setLoading(false);
  }

  async function saltarTodo() {
    const localId = await getLocalId();
    if (localId) await supabase.from("locales").update({ onboarding_completado: true }).eq("id", localId);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("perfiles").update({ primer_login: false }).eq("id", user.id);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-noche flex flex-col items-center justify-start pt-8 pb-16 px-4">
      <div className="mb-8 text-center">
        <span className="text-3xl font-black text-white tracking-tighter">MI<span className="text-amber-400">SE</span></span>
      </div>

      {paso === 5 && (
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">¡Todo listo!</h1>
          <p className="text-slate-400 mb-8">Tu local está configurado. Puedes añadir más detalles desde Ajustes en cualquier momento.</p>
          <button onClick={() => { router.push("/dashboard"); router.refresh(); }} className="btn-primary w-full justify-center py-3 text-base">
            Entrar al dashboard <ArrowRight size={18} />
          </button>
        </div>
      )}

      {paso < 5 && (
        <div className="w-full max-w-lg">
          <div className="flex items-start gap-2 mb-8">
            {PASOS_INFO.map((p, i) => {
              const n = i + 1;
              const activo = paso === n;
              const hecho = paso > n;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${hecho ? "bg-teal-500 text-white" : activo ? "bg-white text-noche" : "bg-slate-700 text-slate-400"}`}>
                    {hecho ? <Check size={14} /> : n}
                  </div>
                  <span className={`text-xs ${activo ? "text-white" : "text-slate-500"}`}>{p.label}</span>
                </div>
              );
            })}
          </div>

          <div className="bg-noche-light rounded-2xl border border-slate-700 overflow-hidden">

            {paso === 1 && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-teal-900/50 rounded-xl flex items-center justify-center"><Store size={20} className="text-teal-400" /></div>
                  <div><h2 className="text-white font-bold text-lg">Datos de tu local</h2><p className="text-slate-400 text-sm">La información básica de tu negocio</p></div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Nombre del local *</label>
                    <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Bar El Rincón" className="input bg-noche border-slate-600 text-white placeholder-slate-500 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Tipo *</label>
                    <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="input bg-noche border-slate-600 text-white focus:ring-teal-500">
                      <option value="">Selecciona tipo...</option>
                      {TIPOS_LOCAL.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Dirección</label>
                      <input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Calle, número..." className="input bg-noche border-slate-600 text-white placeholder-slate-500" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Ciudad</label>
                      <input value={form.ciudad} onChange={e => setForm({...form, ciudad: e.target.value})} placeholder="Madrid" className="input bg-noche border-slate-600 text-white placeholder-slate-500" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Teléfono</label>
                      <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="+34 600 000 000" className="input bg-noche border-slate-600 text-white placeholder-slate-500" />
                    </div>
                  </div>
                </div>
                {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2 mt-4">{error}</p>}
                <div className="flex justify-end mt-6">
                  <button onClick={guardarLocal} disabled={loading} className="btn-primary disabled:opacity-50">
                    {loading ? "Guardando..." : "Siguiente"} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {paso === 2 && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-teal-900/50 rounded-xl flex items-center justify-center"><LayoutGrid size={20} className="text-teal-400" /></div>
                  <div><h2 className="text-white font-bold text-lg">Áreas de inventario</h2><p className="text-slate-400 text-sm">¿Qué zonas gestiona tu local?</p></div>
                </div>
                <div className="space-y-2 mb-4">
                  {areas.map((area, i) => (
                    <div key={i} onClick={() => setAreas(areas.map((a, j) => j === i ? {...a, seleccionada: !a.seleccionada} : a))}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${area.seleccionada ? "border-teal-500/50 bg-teal-900/20" : "border-slate-700 bg-slate-800/30 opacity-60"}`}>
                      <div className="w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0"
                        style={{ borderColor: area.seleccionada ? area.color : "#475569", backgroundColor: area.seleccionada ? area.color : "transparent" }}>
                        {area.seleccionada && <Check size={10} className="text-white" />}
                      </div>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: area.color }} />
                      <span className="text-white font-medium flex-1">{area.nombre}</span>
                      {area.custom && (
                        <button onClick={e => { e.stopPropagation(); setAreas(areas.filter((_, j) => j !== i)); }} className="text-slate-500 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={nuevaArea} onChange={e => setNuevaArea(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && nuevaArea.trim()) { const cols = ["#8B5CF6","#EC4899","#10B981","#F97316"]; setAreas([...areas, { nombre: nuevaArea.trim(), color: cols[areas.length % 4], seleccionada: true, custom: true }]); setNuevaArea(""); }}}
                    placeholder="Añadir área personalizada..." className="input flex-1 bg-noche border-slate-600 text-white placeholder-slate-500 text-sm" />
                  <button onClick={() => { if (!nuevaArea.trim()) return; const cols = ["#8B5CF6","#EC4899","#10B981","#F97316"]; setAreas([...areas, { nombre: nuevaArea.trim(), color: cols[areas.length % 4], seleccionada: true, custom: true }]); setNuevaArea(""); }} className="btn-secondary px-3"><Plus size={16} /></button>
                </div>
                {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2 mt-4">{error}</p>}
                <div className="flex justify-between mt-6">
                  <button onClick={() => setPaso(1)} className="btn-secondary"><ChevronLeft size={16} /> Atrás</button>
                  <button onClick={guardarAreas} disabled={loading} className="btn-primary disabled:opacity-50">{loading ? "Guardando..." : "Siguiente"} <ChevronRight size={16} /></button>
                </div>
              </div>
            )}

            {paso === 3 && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-teal-900/50 rounded-xl flex items-center justify-center"><Users size={20} className="text-teal-400" /></div>
                  <div><h2 className="text-white font-bold text-lg">Invita a tu equipo</h2><p className="text-slate-400 text-sm">Añade encargados y empleados (opcional)</p></div>
                </div>
                {invitados.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {invitados.map((inv, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-800/50 rounded-xl border border-slate-700">
                        <span className="text-white text-sm flex-1 truncate">{inv.email}</span>
                        <span className={`badge ${inv.rol === "encargado" ? "badge-amber" : "badge-slate"}`}>{inv.rol}</span>
                        <button onClick={() => setInvitados(invitados.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} placeholder="email@empleado.com" type="email" className="input flex-1 bg-noche border-slate-600 text-white placeholder-slate-500 text-sm" />
                  <select value={nuevoRol} onChange={e => setNuevoRol(e.target.value as any)} className="input w-36 bg-noche border-slate-600 text-white text-sm">
                    <option value="empleado">Empleado</option>
                    <option value="encargado">Encargado</option>
                  </select>
                  <button onClick={() => { if (!nuevoEmail.trim() || !nuevoEmail.includes("@")) return; setInvitados([...invitados, { email: nuevoEmail.trim(), rol: nuevoRol }]); setNuevoEmail(""); }} className="btn-secondary px-3"><Plus size={16} /></button>
                </div>
                <p className="text-slate-500 text-xs mt-3">Las invitaciones se enviarán por email. Puedes añadir más desde Ajustes → Equipo.</p>
                <div className="flex justify-between mt-6">
                  <button onClick={() => setPaso(2)} className="btn-secondary"><ChevronLeft size={16} /> Atrás</button>
                  <div className="flex gap-2">
                    <button onClick={() => setPaso(4)} className="btn-secondary text-slate-400">Saltar</button>
                    <button onClick={guardarEquipo} disabled={loading} className="btn-primary disabled:opacity-50">{loading ? "..." : "Siguiente"} <ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
            )}

            {paso === 4 && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-teal-900/50 rounded-xl flex items-center justify-center"><UtensilsCrossed size={20} className="text-teal-400" /></div>
                  <div><h2 className="text-white font-bold text-lg">Categorías de carta</h2><p className="text-slate-400 text-sm">Las secciones de tu menú (opcional)</p></div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categorias.map((cat, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-teal-900/30 border border-teal-700/50 rounded-lg px-3 py-1.5">
                      <span className="text-teal-300 text-sm font-medium">{cat}</span>
                      <button onClick={() => setCategorias(categorias.filter((_, j) => j !== i))} className="text-teal-500 hover:text-red-400 ml-1"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={nuevaCat} onChange={e => setNuevaCat(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && nuevaCat.trim()) { setCategorias([...categorias, nuevaCat.trim()]); setNuevaCat(""); }}}
                    placeholder="Nueva categoría..." className="input flex-1 bg-noche border-slate-600 text-white placeholder-slate-500 text-sm" />
                  <button onClick={() => { if (!nuevaCat.trim()) return; setCategorias([...categorias, nuevaCat.trim()]); setNuevaCat(""); }} className="btn-secondary px-3"><Plus size={16} /></button>
                </div>
                {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2 mt-4">{error}</p>}
                <div className="flex justify-between mt-6">
                  <button onClick={() => setPaso(3)} className="btn-secondary"><ChevronLeft size={16} /> Atrás</button>
                  <div className="flex gap-2">
                    <button onClick={finalizarOnboarding} className="btn-secondary text-slate-400">Saltar</button>
                    <button onClick={finalizarOnboarding} disabled={loading} className="btn-primary disabled:opacity-50">{loading ? "Guardando..." : "¡Finalizar!"} <Check size={16} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {paso < 4 && (
            <div className="text-center mt-4">
              <button onClick={saltarTodo} className="text-slate-500 text-sm hover:text-slate-400 transition-colors">
                Saltar configuración y entrar al dashboard →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
