import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "MISE — Configura tu local" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("local_id, rol, onboarding_completado")
    .eq("id", user.id)
    .single();

  if (perfil?.onboarding_completado) redirect("/dashboard");
  if (perfil?.rol === "empleado") redirect("/onboarding/empleado");

  let localData = null;
  if (perfil?.local_id) {
    const { data } = await supabase
      .from("locales")
      .select("id, nombre, tipo, direccion, ciudad, provincia, codigo_postal, telefono, email")
      .eq("id", perfil.local_id)
      .single();
    localData = data;
  }

  return (
    <OnboardingWizard
      localId={localData?.id}
      localNombre={localData?.nombre}
      localTipo={localData?.tipo}
      localDireccion={localData?.direccion}
      localCiudad={localData?.ciudad}
      localProvincia={localData?.provincia}
      localCP={localData?.codigo_postal}
      localTelefono={localData?.telefono}
      localEmail={localData?.email}
    />
  );
}
