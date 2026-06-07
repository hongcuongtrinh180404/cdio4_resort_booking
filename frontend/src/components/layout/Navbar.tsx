"use client";

import Link from "next/link";
import { isAuthenticated, getUser, removeToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    removeToken();
    router.push("/");
  };

  return (
    <nav className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/" className="text-xl font-bold text-blue-600">DTUVIVI</Link>
      <div className="flex items-center gap-4">
        <Link href="/rooms" className="hover:text-blue-600">Phòng</Link>
        {isAuthenticated() ? (
          <>
            <Link href="/profile" className="hover:text-blue-600">{user?.email}</Link>
            {user?.role !== "GUEST" && (
              <Link href="/admin/dashboard" className="hover:text-blue-600">Admin</Link>
            )}
            <button onClick={handleLogout} className="text-red-600 hover:underline">Đăng xuất</button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-blue-600">Đăng nhập</Link>
            <Link href="/register" className="rounded bg-blue-600 px-4 py-1 text-white hover:bg-blue-700">Đăng ký</Link>
          </>
        )}
      </div>
    </nav>
  );
}
