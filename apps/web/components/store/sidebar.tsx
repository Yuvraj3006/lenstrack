"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FilePlus, ShoppingBag, LogOut, Eye } from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", href: "/store/dashboard", icon: LayoutDashboard },
  { label: "Issue Authentication", href: "/store/issue", icon: FilePlus },
  { label: "Orders", href: "/store/orders", icon: ShoppingBag },
];

export function StoreSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/store/auth/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/store/login");
  }

  return (
    <aside className="w-64 min-h-screen bg-[#1A1A2E] text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Eye className="h-6 w-6 text-[#E94560]" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Lens<span className="text-[#E94560]">track</span>
            </h1>
            <p className="text-xs text-white/50">Store Portal</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active ? "bg-[#E94560] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
