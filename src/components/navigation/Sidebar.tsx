"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, ClipboardList, Users, Package, UtensilsCrossed,
  Truck, TrendingUp, Settings, LogOut, ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { clsx } from "clsx";

const ICON_MAP: Record<string, React.ElementType> = {
  Home, ClipboardList, Users, Package, UtensilsCrossed,
  Truck, TrendingUp, Settings,
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-16 lg:w-56 h-screen bg-noche
                      border-r border-slate-800 flex-shrink-0 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-noche font-black text-sm">M</span>
        </div>
        <span className="hidden lg:block text-white font-black text-lg tracking-tight">
          MI<span className="text-amber-400">SE</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "nav-item group",
                isActive && "active"
              )}
            >
              <Icon
                size={18}
                className={clsx(
                  "nav-icon flex-shrink-0 transition-colors",
                  isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className="hidden lg:block truncate">{item.label}</span>
              {isActive && (
                <ChevronRight size={14} className="hidden lg:block ml-auto text-amber-400/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="nav-item w-full hover:text-red-400"
        >
          <LogOut size={18} className="text-slate-500 flex-shrink-0" />
          <span className="hidden lg:block">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
