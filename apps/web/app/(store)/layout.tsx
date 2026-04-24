"use client";

import { usePathname } from "next/navigation";
import { StoreSidebar } from "@/components/store/sidebar";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/store/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StoreSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
