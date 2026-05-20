import { createClient } from "@/lib/supabase/server";
import CartaClient from "./CartaClient";

export const metadata = { title: "MISE — Carta" };

export default async function CartaPage() {
  const supabase = await createClient();

  const [
    { data: perfil },
    { data: categorias },
    { data: platos },
  ] = await Promise.all([
    supabase.from("perfiles").select("local_id").single(),
    supabase.from("categorias_carta")
      .select("id, nombre, descripcion, orden, activa")
      .eq("activa", true)
      .order("orden"),
    supabase.from("platos")
      .select("id, local_id, categoria_id, nombre, descripcion, precio_venta, coste_estimado, tiempo_prep, foto_url, disponible, en_menu_dia, activo, orden, notas_cocina")
      .eq("activo", true)
      .order("orden"),
  ]);

  return (
    <CartaClient
      localId={perfil?.local_id ?? ""}
      initialCategorias={categorias ?? []}
      initialPlatos={platos ?? []}
    />
  );
}
