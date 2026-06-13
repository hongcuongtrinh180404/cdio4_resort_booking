"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser, removeToken } from "@/lib/auth";
import type { JwtPayload } from "@/lib/auth";
import { Icon } from "@iconify/react";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/rooms", label: "Phòng nghỉ" },
  { href: "/services", label: "Dịch vụ" },
  { href: "/about", label: "Về chúng tôi" },
  { href: "#footer", label: "Liên hệ" },
];

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = useCallback(() => {
    removeToken();
    setUser(null);
    window.location.href = "/";
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "/index.html";
    if (href.startsWith("#")) return false;
    return pathname.startsWith(href);
  };

  useEffect(() => {
    setUser(getUser());
    if (pathname.startsWith("/admin")) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-outline ${
        scrolled
          ? "shadow-md bg-surface/95 backdrop-blur-md"
          : "bg-surface/80 backdrop-blur-md"
      }`}
    >
      <div className="flex justify-between items-center max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-4">
        <Link href="/" className="flex-shrink-0">
          <img
            src="https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780902098/60340468-5c1e-4171-9fc0-98c767b00b26_q3vvbe.png"
            alt="DTUVIVU"
            className="h-10 md:h-12 w-auto"
          />
        </Link>

        <nav className="hidden md:flex gap-8 items-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-label-caps text-label-caps uppercase tracking-wider transition-all ${
                isActive(link.href)
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-on-surface-variant font-medium hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => (window.location.href = "/rooms")}
            className="bg-primary hover:bg-primary/95 text-on-primary px-6 py-2.5 rounded-full font-label-caps text-label-caps transition-all duration-200 shadow-sm active:scale-95"
          >
            Đặt phòng ngay
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {user.role !== "GUEST" && (
                <Link
                  href="/admin/dashboard"
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-sm hover:scale-105 active:scale-95 transition-all block"
              >
                <img
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                />
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-on-surface-variant hover:text-error transition-colors hidden md:block"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-label-caps text-label-caps uppercase tracking-wider hidden md:block"
            >
              Đăng nhập
            </Link>
          )}

          <button
            className="md:hidden text-on-surface"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Icon icon={mobileOpen ? "material-symbols:close" : "material-symbols:menu"} className="text-2xl" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-outline px-margin-mobile py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block font-label-caps text-label-caps uppercase tracking-wider py-2 ${
                isActive(link.href)
                  ? "text-primary font-semibold"
                  : "text-on-surface-variant"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block font-label-caps text-label-caps uppercase tracking-wider py-2 text-on-surface-variant"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
