export const NAV_ITEMS = [
  { href: "/dashboard",    label: "Inicio",      icon: "Home" },
  { href: "/operaciones",  label: "Operaciones", icon: "ClipboardList" },
  { href: "/personal",     label: "Personal",    icon: "Users" },
  { href: "/stock",        label: "Stock",       icon: "Package" },
  { href: "/carta",        label: "Carta",       icon: "UtensilsCrossed" },
  { href: "/proveedores",  label: "Proveedores", icon: "Truck" },
  { href: "/finanzas",     label: "Finanzas",    icon: "TrendingUp" },
  { href: "/ajustes",      label: "Ajustes",     icon: "Settings" },
];

// Los 5 primeros van al bottom nav en móvil
export const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);
