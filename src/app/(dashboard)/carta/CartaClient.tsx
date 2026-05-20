"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Edit2, Trash2, X, Check, UtensilsCrossed,
  Clock, Star, Settings,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────
type Categoria = {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activa: boolean;
};

type Plato = {
  id: string;
  local_id: string;
  categoria_id: string | null;
  nombre: string;
  descripcion: string | null;
  precio_venta: number;
  coste_estimado: number | null;
  tiempo_prep: number | null;
  foto_url: string | null;
  disponible: boolean;
  en_menu_dia: boolean;
  activo: boolean;
  orden: number;
  notas_cocina: string | null;
};

type Props = {
  localId: string;
  initialCategorias: Categoria[];
  initialPlatos: Plato[];
};

// ── Plato form defaults ──────────────────────────────────────────
function emptyPlato(overrides?: Partial<Plato>): Partial<Plato> {
  return {
    nombre: "",
    descripcion: "",
    precio_venta: 0,
    coste_estimado: undefined,
    categoria_id: undefined,
    tiempo_prep: undefined,
    notas_cocina: "",
    disponible: true,
    en_menu_dia: false,
    ...overrides,
  };
}

// ── Modal: Añadir / Editar plato ─────────────────────────────────
function PlatoModal({
  plato,
  categorias,
  onClose,
  onSave,
}: {
  plato: Partial<Plato> | null;
  categorias: Categoria[];
  onClose: () => void;
  onSave: (p: Partial<Plato>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<Plato>>(
    plato ? { ...plato } : emptyPlato()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof Plato, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit() {
    if (!form.nombre?.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!form.precio_venta || Number(form.precio_venta) <= 0) {
      setError("El precio debe ser mayor que 0");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Error al guardar");
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-bold text-slate-900">
            {form.id ? "Editar plato" : "Nuevo plato"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              value={form.nombre ?? ""}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Croquetas de jamón"
              className="input"
            />
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              value={form.descripcion ?? ""}
              onChange={(e) => set("descripcion", e.target.value)}
              placeholder="Ingredientes, presentación…"
              rows={2}
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Precio venta (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precio_venta ?? ""}
                onChange={(e) =>
                  set("precio_venta", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="input"
              />
            </div>
            <div>
              <label className="label">Coste estimado (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.coste_estimado ?? ""}
                onChange={(e) =>
                  set(
                    "coste_estimado",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="0.00"
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoría</label>
              <select
                value={form.categoria_id ?? ""}
                onChange={(e) =>
                  set("categoria_id", e.target.value || null)
                }
                className="input"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tiempo prep. (min)</label>
              <input
                type="number"
                min="0"
                value={form.tiempo_prep ?? ""}
                onChange={(e) =>
                  set(
                    "tiempo_prep",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="15"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Notas para cocina</label>
            <textarea
              value={form.notas_cocina ?? ""}
              onChange={(e) => set("notas_cocina", e.target.value)}
              placeholder="Tips de presentación, alergias frecuentes…"
              rows={2}
              className="input resize-none"
            />
          </div>

          <div className="flex gap-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.disponible ?? true}
                onChange={(e) => set("disponible", e.target.checked)}
                className="w-4 h-4 rounded accent-teal-600"
              />
              <span className="text-sm text-slate-700">Disponible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.en_menu_dia ?? false}
                onChange={(e) => set("en_menu_dia", e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm text-slate-700">Menú del día</span>
            </label>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Gestión de categorías ────────────────────────────────
function CategoriasModal({
  categorias,
  onClose,
  onSave,
  onDelete,
}: {
  categorias: Categoria[];
  onClose: () => void;
  onSave: (nombre: string, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [newNombre, setNewNombre] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newNombre.trim()) return;
    setSaving(true);
    await onSave(newNombre.trim());
    setNewNombre("");
    setSaving(false);
  }

  async function handleEdit(id: string) {
    if (!editNombre.trim()) return;
    setSaving(true);
    await onSave(editNombre.trim(), id);
    setEditId(null);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">

        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Gestionar categorías</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-2 max-h-80 overflow-y-auto">
          {categorias.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">
              No hay categorías todavía
            </p>
          )}
          {categorias.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              {editId === cat.id ? (
                <>
                  <input
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="input flex-1 py-1.5 text-sm"
                    autoFocus
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleEdit(cat.id)
                    }
                  />
                  <button
                    onClick={() => handleEdit(cat.id)}
                    disabled={saving}
                    className="p-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-800 font-medium py-1">
                    {cat.nombre}
                  </span>
                  <button
                    onClick={() => {
                      setEditId(cat.id);
                      setEditNombre(cat.nombre);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(cat.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder="Nueva categoría…"
              className="input flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newNombre.trim()}
              className="btn-primary disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta de plato ─────────────────────────────────────────────
function PlatoCard({
  plato,
  onToggle,
  onEdit,
  onDelete,
}: {
  plato: Plato;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const margen =
    plato.coste_estimado && plato.precio_venta > 0
      ? (
          ((plato.precio_venta - plato.coste_estimado) /
            plato.precio_venta) *
          100
        ).toFixed(0)
      : null;

  return (
    <div
      className={`card p-4 flex flex-col gap-3 transition-opacity ${
        !plato.disponible ? "opacity-55" : ""
      }`}
    >
      {/* Foto */}
      <div className="w-full h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
        {plato.foto_url ? (
          <img
            src={plato.foto_url}
            alt={plato.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <UtensilsCrossed size={28} className="text-slate-300" />
        )}
      </div>

      {/* Badges */}
      {(plato.en_menu_dia || plato.tiempo_prep || margen) && (
        <div className="flex flex-wrap gap-1">
          {plato.en_menu_dia && (
            <span className="badge badge-amber flex items-center gap-1">
              <Star size={9} /> Menú
            </span>
          )}
          {plato.tiempo_prep && (
            <span className="badge badge-slate flex items-center gap-1">
              <Clock size={9} /> {plato.tiempo_prep}min
            </span>
          )}
          {margen && (
            <span className="badge badge-slate">{margen}% mg</span>
          )}
        </div>
      )}

      {/* Nombre + precio */}
      <div className="flex items-start justify-between gap-2 flex-1">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
            {plato.nombre}
          </p>
          {plato.descripcion && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
              {plato.descripcion}
            </p>
          )}
        </div>
        <span className="text-base font-black text-teal-700 flex-shrink-0">
          {Number(plato.precio_venta).toFixed(2)}€
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <button
          onClick={onToggle}
          className={`text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
            plato.disponible
              ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              plato.disponible ? "bg-teal-500" : "bg-slate-400"
            }`}
          />
          {plato.disponible ? "Disponible" : "No disp."}
        </button>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
export default function CartaClient({
  localId,
  initialCategorias,
  initialPlatos,
}: Props) {
  const supabase = createClient();

  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias);
  const [platos, setPlatos] = useState<Plato[]>(initialPlatos);
  const [catActiva, setCatActiva] = useState<string | null>(null);
  const [modalPlato, setModalPlato] = useState<{
    open: boolean;
    plato: Partial<Plato> | null;
  }>({ open: false, plato: null });
  const [showCategorias, setShowCategorias] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const platosFiltrados =
    catActiva === null
      ? platos
      : platos.filter((p) => p.categoria_id === catActiva);

  // ── Toggle disponible ────────────────────────────────────────
  async function toggleDisponible(plato: Plato) {
    const nuevo = !plato.disponible;
    setPlatos((ps) =>
      ps.map((p) => (p.id === plato.id ? { ...p, disponible: nuevo } : p))
    );
    await supabase
      .from("platos")
      .update({ disponible: nuevo })
      .eq("id", plato.id);
  }

  // ── Guardar plato ────────────────────────────────────────────
  async function savePlato(form: Partial<Plato>) {
    if (form.id) {
      // Update
      const { data, error } = await supabase
        .from("platos")
        .update({
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          precio_venta: form.precio_venta,
          coste_estimado: form.coste_estimado ?? null,
          categoria_id: form.categoria_id ?? null,
          tiempo_prep: form.tiempo_prep ?? null,
          notas_cocina: form.notas_cocina || null,
          disponible: form.disponible,
          en_menu_dia: form.en_menu_dia,
        })
        .eq("id", form.id)
        .select()
        .single();
      if (error) throw error;
      if (data) setPlatos((ps) => ps.map((p) => (p.id === data.id ? data : p)));
    } else {
      // Insert
      const maxOrden = Math.max(0, ...platos.map((p) => p.orden ?? 0));
      const { data, error } = await supabase
        .from("platos")
        .insert({
          local_id: localId,
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          precio_venta: form.precio_venta,
          coste_estimado: form.coste_estimado ?? null,
          categoria_id: form.categoria_id ?? null,
          tiempo_prep: form.tiempo_prep ?? null,
          notas_cocina: form.notas_cocina || null,
          disponible: form.disponible ?? true,
          en_menu_dia: form.en_menu_dia ?? false,
          orden: maxOrden + 1,
        })
        .select()
        .single();
      if (error) throw error;
      if (data) setPlatos((ps) => [...ps, data]);
    }
  }

  // ── Eliminar plato (soft delete) ─────────────────────────────
  async function deletePlato(id: string) {
    await supabase.from("platos").update({ activo: false }).eq("id", id);
    setPlatos((ps) => ps.filter((p) => p.id !== id));
    setConfirmDelete(null);
  }

  // ── Guardar categoría ────────────────────────────────────────
  async function saveCategoria(nombre: string, id?: string) {
    if (id) {
      const { data, error } = await supabase
        .from("categorias_carta")
        .update({ nombre })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      if (data) setCategorias((cs) => cs.map((c) => (c.id === id ? data : c)));
    } else {
      const maxOrden = Math.max(0, ...categorias.map((c) => c.orden ?? 0));
      const { data, error } = await supabase
        .from("categorias_carta")
        .insert({ nombre, local_id: localId, orden: maxOrden + 1 })
        .select()
        .single();
      if (error) throw error;
      if (data) setCategorias((cs) => [...cs, data]);
    }
  }

  // ── Eliminar categoría (soft delete) ────────────────────────
  async function deleteCategoria(id: string) {
    await supabase
      .from("categorias_carta")
      .update({ activa: false })
      .eq("id", id);
    setCategorias((cs) => cs.filter((c) => c.id !== id));
    if (catActiva === id) setCatActiva(null);
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Carta</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {platos.length} platos · {categorias.length} categorías
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowCategorias(true)}
            className="btn-secondary text-sm py-2"
          >
            <Settings size={15} /> Categorías
          </button>
          <button
            onClick={() => setModalPlato({ open: true, plato: null })}
            className="btn-primary text-sm py-2"
          >
            <Plus size={15} /> Nuevo plato
          </button>
        </div>
      </div>

      {/* Tabs de categorías */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        <button
          onClick={() => setCatActiva(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            catActiva === null
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Todos ({platos.length})
        </button>
        {categorias.map((cat) => {
          const count = platos.filter((p) => p.categoria_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setCatActiva(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                catActiva === cat.id
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.nombre} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de platos */}
      {platosFiltrados.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {platosFiltrados.map((plato) => (
            <PlatoCard
              key={plato.id}
              plato={plato}
              onToggle={() => toggleDisponible(plato)}
              onEdit={() => setModalPlato({ open: true, plato })}
              onDelete={() => setConfirmDelete(plato.id)}
            />
          ))}
          {/* Tarjeta añadir */}
          <button
            onClick={() =>
              setModalPlato({
                open: true,
                plato: catActiva ? emptyPlato({ categoria_id: catActiva }) : null,
              })
            }
            className="card min-h-48 flex flex-col items-center justify-center gap-2
                       border-2 border-dashed border-slate-200 text-slate-300
                       hover:text-teal-500 hover:border-teal-300 transition-colors cursor-pointer"
          >
            <Plus size={22} />
            <span className="text-sm font-medium">Añadir plato</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <UtensilsCrossed size={48} className="mx-auto mb-4 opacity-25" />
          <p className="font-semibold text-slate-600 text-lg">
            {catActiva ? "Sin platos en esta categoría" : "La carta está vacía"}
          </p>
          <p className="text-sm mt-1 mb-6">
            {catActiva
              ? "Añade el primer plato de esta categoría."
              : "Empieza añadiendo categorías y platos."}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {categorias.length === 0 && (
              <button
                onClick={() => setShowCategorias(true)}
                className="btn-secondary"
              >
                <Settings size={16} /> Crear categorías
              </button>
            )}
            <button
              onClick={() =>
                setModalPlato({
                  open: true,
                  plato: catActiva
                    ? emptyPlato({ categoria_id: catActiva })
                    : null,
                })
              }
              className="btn-primary"
            >
              <Plus size={16} /> Añadir plato
            </button>
          </div>
        </div>
      )}

      {/* ── Modales ── */}

      {modalPlato.open && (
        <PlatoModal
          plato={modalPlato.plato}
          categorias={categorias}
          onClose={() => setModalPlato({ open: false, plato: null })}
          onSave={savePlato}
        />
      )}

      {showCategorias && (
        <CategoriasModal
          categorias={categorias}
          onClose={() => setShowCategorias(false)}
          onSave={saveCategoria}
          onDelete={deleteCategoria}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 mb-2">¿Eliminar plato?</h3>
            <p className="text-slate-500 text-sm mb-5">
              El plato dejará de aparecer en la carta. Esta acción no se puede
              deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={() => deletePlato(confirmDelete)}
                className="flex-1 justify-center btn-primary
                           bg-red-500 hover:bg-red-600 border-red-500
                           focus:ring-red-300"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
