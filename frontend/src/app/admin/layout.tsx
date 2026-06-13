"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { removeToken, getUser } from "@/lib/auth";
import type { JwtPayload } from "@/lib/auth";
import { Icon } from "@iconify/react";

const SIDEBAR_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/bookings", label: "Quản lý booking", icon: "receipt-long" },
  { href: "/admin/rooms", label: "Quản lý phòng", icon: "meeting-room" },
  { href: "/admin/services", label: "Dịch vụ", icon: "spa" },
  { href: "/admin/service-combos", label: "Combo", icon: "diamond" },
  { href: "/admin/reports", label: "Báo cáo doanh thu", icon: "finance" },
  { href: "/admin/users", label: "Quản lý người dùng", icon: "people" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<JwtPayload | null>(null);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u || (u.role !== "EMPLOYEE" && u.role !== "ADMIN")) {
      router.push("/");
    }
  }, [router]);

  const handleLogout = () => {
    removeToken();
    window.location.href = "/";
  };

  return (
    <>
      <style>{`
        body > footer { display: none !important; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-white border-r border-outline flex flex-col transition-all duration-300 shrink-0`}>
          {/* Logo */}
          <div className="h-[72px] flex items-center gap-3 px-4 border-b border-outline">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="shrink-0 text-on-surface hover:text-primary transition-colors">
              <Icon icon={sidebarOpen ? "material-symbols:menu-open" : "material-symbols:menu"} className="text-lg" />
            </button>
            {sidebarOpen && (
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <img
                  src="https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780902098/60340468-5c1e-4171-9fc0-98c767b00b26_q3vvbe.png"
                  alt="DTUVIVU"
                  className="h-8 w-auto"
                />
                <span className="font-bold text-primary text-sm tracking-wide">DTUVIVU</span>
              </Link>
            )}
          </div>

          {/* Nav Links */}
          <nav className="flex-1 py-4 space-y-1 px-3">
            {SIDEBAR_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-body-sm ${active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  title={!sidebarOpen ? link.label : undefined}
                >
                  <Icon icon={`material-symbols:${link.icon}`} className="text-lg shrink-0" />
                  {sidebarOpen && <span>{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-outline p-3 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all"
              title={!sidebarOpen ? "Về trang chủ" : undefined}
            >
              <Icon icon="material-symbols:home" className="text-lg shrink-0" />
              {sidebarOpen && <span>Về trang chủ</span>}
            </Link>
            {user && sidebarOpen && (
              <div className="px-3 py-2 text-body-xs text-on-surface-variant">
                <p className="font-medium text-on-surface truncate">{user.email}</p>
                <p className="capitalize">{user.role.toLowerCase()}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm text-on-surface-variant hover:bg-red-50 hover:text-error transition-all w-full"
              title={!sidebarOpen ? "Đăng xuất" : undefined}
            >
              <Icon icon="material-symbols:logout" className="text-lg shrink-0" />
              {sidebarOpen && <span>Đăng xuất</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </>
  );
}
