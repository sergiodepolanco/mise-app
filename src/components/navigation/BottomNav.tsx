"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Users, Package, UtensilsCrossed } from "lucide-react";
import { BOTTOM_NAV_ITEMS } from "./nav-items";
import { clsx } from "clsx";

const ICON_MAP: Record<string, React.ElementType> = {
  Home, ClipboardList, Users, Package, UtensilsCrossed,
};

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50
                    bg-noche border-t border-slate-800
                    flex items-center justify-around
                    pb-safe px-2 pt-2">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = ICON_MAP[item.icon];
        const isActive = pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl",
              "transition-colors duration-150 min-w-[52px]",
              isActive ? "text-amber-400" : "text-slate-500"
            )}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={clsx(
              "text-[10px] font-medium",
              isActive ? "text-amber-400" : "text-slate-500"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
