"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  ShoppingBag,
  Settings,
  FileText,
  BookOpen,
  BarChart3,
  LogOut,
  Shield,
} from "lucide-react";
import { LenstrackLogo } from "@/components/lenstrack-logo";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Stores", href: "/admin/stores", icon: Store },
  { label: "Store Users", href: "/admin/store-users", icon: Users },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Masters", href: "/admin/masters", icon: Settings },
  { label: "Lens Care Tips", href: "/admin/lens-care", icon: BookOpen },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Audit Log", href: "/admin/audit-log", icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    toast.success("Logged out successfully");
    router.push("/admin/login");
  }

  return (
    <aside className="w-64 min-h-screen bg-[#1A1A2E] text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div>
          <LenstrackLogo width={118} className="mb-1" />
          <p className="text-xs text-white/50">Admin Portal</p>
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
                active
                  ? "bg-[#E94560] text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <Shield className="h-4 w-4 text-[#E94560]" />
          <span className="text-xs text-white/50">Super Admin</span>
        </div>
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
