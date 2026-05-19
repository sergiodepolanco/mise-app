import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays, Users, Package, AlertTriangle,
  TrendingUp, CheckCircle2, Clock, ChevronRight,
} from "lucide-react";
import Link from "next/link";

// ── Componente StatCard ──────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "teal",
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: "teal" | "amber" | "red" | "slate";
  href?: string;
}) {
  const colorMap = {
    teal:  { bg: "bg-teal-50",  icon: "text-teal-700",  border: "border-teal-100"  },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
    red:   { bg: "bg-red-50",   icon: "text-red-600",   border: "border-red-100"   },
    slate: { bg: "bg-slate-50", icon: "text-slate-600", border: "border-slate-200" },
  };
  const c = colorMap[color];

  const content = (
    <div className={`card p-4 flex items-start gap-4 border ${c.border}
                     ${href ? "hover:shadow-mise transition-shadow duration-150 cursor-pointer" : ""}`}>
      <div className={`${c.bg} ${c.icon} p-2.5 rounded-xl flex-shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {href && <ChevronRight size={16} className="text-slate-300 flex-shrink-0 mt-1" />}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

// ── Página principal del Dashboard ──────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient();
  const hoy = new Date();
  const fechaHoy = format(hoy, "yyyy-MM-dd");

  // Obtener datos en paralelo
  const [
    { data: reservasHoy },
    { data: empleadosActivos },
    { data: stockBajoMinimo },
    { data: incidenciasAbiertas },
    { data: checklistsHoy },
    { data: perfil },
  ] = await Promise.all([
    supabase.from("reservas")
      .select("id, nombre_cliente, num_personas, hora, estado, mesa_id")
      .eq("fecha", fechaHoy)
      .neq("estado", "cancelada")
      .order("hora"),
    supabase.from("empleados")
      .select("id, nombre, apellidos, departamento")
      .eq("activo", true),
    supabase.from("productos_stock")
      .select("id, nombre, stock_actual, stock_minimo, unidad_compra")
      .filter("stock_actual", "lte", "stock_minimo")
      .eq("activo", true)
      .limit(5),
    supabase.from("incidencias")
      .select("id, tipo, descripcion, prioridad, created_at")
      .in("estado", ["abierta", "en_proceso"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("checklists_diarios")
      .select("id, tipo, completado")
      .eq("fecha", fechaHoy),
    supabase.from("perfiles")
      .select("nombre, rol")
      .single(),
  ]);

  const nombreUsuario = perfil?.nombre?.split(" ")[0] ?? "Equipo";
  const horaActual = hoy.getHours();
  const saludo = horaActual < 13 ? "Buenos días" : horaActual < 20 ? "Buenas tardes" : "Buenas noches";
  const fechaFormateada = format(hoy, "EEEE, d 'de' MMMM", { locale: es });
  const checklistsCompletos = checklistsHoy?.filter(c => c.completado).length ?? 0;

  const prioridadColor: Record<string, string> = {
    urgente: "badge-red",
    alta:    "badge-red",
    media:   "badge-amber",
    baja:    "badge-slate",
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <p className="text-slate-400 text-sm capitalize">{fechaFormateada}</p>
        <h1 className="text-2xl font-black text-slate-900 mt-0.5">
          {saludo}, {nombreUsuario} 👋
        </h1>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={CalendarDays}
          label="Reservas hoy"
          value={reservasHoy?.length ?? 0}
          sub={`${reservasHoy?.reduce((a, r) => a + r.num_personas, 0) ?? 0} personas`}
          color="teal"
          href="/operaciones"
        />
        <StatCard
          icon={Users}
          label="Empleados activos"
          value={empleadosActivos?.length ?? 0}
          sub="en plantilla"
          color="slate"
          href="/personal"
        />
        <StatCard
          icon={Package}
          label="Stock bajo mínimo"
          value={stockBajoMinimo?.length ?? 0}
          sub={stockBajoMinimo?.length ? "Pedir hoy" : "Todo OK"}
          color={stockBajoMinimo?.length ? "amber" : "teal"}
          href="/stock"
        />
        <StatCard
          icon={AlertTriangle}
          label="Incidencias abiertas"
          value={incidenciasAbiertas?.length ?? 0}
          sub={incidenciasAbiertas?.length ? "Requieren atención" : "Sin incidencias"}
          color={incidenciasAbiertas?.length ? "red" : "teal"}
          href="/operaciones"
        />
      </div>

      {/* Fila inferior: Reservas + Incidencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Reservas del día */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays size={16} className="text-teal-600" />
              Reservas de hoy
            </h2>
            <Link href="/operaciones" className="text-teal-600 text-xs font-semibold hover:text-teal-700">
              Ver todas →
            </Link>
          </div>
          {reservasHoy && reservasHoy.length > 0 ? (
            <div className="space-y-2">
              {reservasHoy.slice(0, 5).map((r) => (
                <div key={r.id}
                  className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                      <span className="text-teal-700 font-bold text-xs">{r.num_personas}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{r.nombre_cliente}</p>
                      <p className="text-xs text-slate-400">{r.num_personas} personas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">{r.hora?.slice(0,5)}</span>
                    <span className={`badge ${r.estado === "confirmada" ? "badge-green" : "badge-amber"}`}>
                      {r.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin reservas para hoy</p>
            </div>
          )}
        </div>

        {/* Panel derecho: Stock + Checklists */}
        <div className="space-y-4">

          {/* Stock bajo mínimo */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Package size={16} className="text-amber-500" />
                Pedir hoy
              </h2>
              <Link href="/stock" className="text-teal-600 text-xs font-semibold hover:text-teal-700">
                Ver stock →
              </Link>
            </div>
            {stockBajoMinimo && stockBajoMinimo.length > 0 ? (
              <div className="space-y-2">
                {stockBajoMinimo.map((p) => (
                  <div key={p.id}
                    className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-medium truncate">{p.nombre}</span>
                    <span className="badge badge-amber ml-2 flex-shrink-0">
                      {p.stock_actual} / {p.stock_minimo}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-teal-600 text-sm">
                <CheckCircle2 size={16} />
                <span>Todo el stock en orden</span>
              </div>
            )}
          </div>

          {/* Checklists */}
          <div className="card p-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Clock size={16} className="text-teal-600" />
              Checklists de hoy
            </h2>
            {checklistsHoy && checklistsHoy.length > 0 ? (
              <div className="space-y-2">
                {checklistsHoy.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      size={16}
                      className={c.completado ? "text-teal-500" : "text-slate-200"}
                    />
                    <span className={c.completado ? "text-slate-400 line-through" : "text-slate-700"}>
                      {c.tipo ?? "Checklist"}
                    </span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-slate-400">
                  {checklistsCompletos}/{checklistsHoy.length} completados
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">
                <p className="text-sm">Sin checklists programados</p>
                <Link href="/operaciones" className="text-teal-600 text-xs mt-1 block hover:underline">
                  Crear checklist →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Incidencias abiertas */}
      {incidenciasAbiertas && incidenciasAbiertas.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Incidencias abiertas
            </h2>
            <Link href="/operaciones" className="text-teal-600 text-xs font-semibold">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {incidenciasAbiertas.map((i) => (
              <div key={i.id}
                className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className={`badge ${prioridadColor[i.prioridad ?? "media"]} flex-shrink-0 mt-0.5`}>
                  {i.prioridad}
                </span>
                <p className="text-sm text-slate-700 leading-snug">{i.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
