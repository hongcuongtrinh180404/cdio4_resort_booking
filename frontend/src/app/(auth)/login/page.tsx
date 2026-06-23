"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { setToken } from "@/lib/auth";
import Link from "next/link";
import { Icon } from "@iconify/react";

const QUICK_LOGINS = [
  { label: "ADMIN", icon: "material-symbols:crown", email: "admin@dtuvivi.com", color: "bg-red-600 hover:bg-red-700" },
  { label: "STAFF", icon: "material-symbols:work", email: "employee@dtuvivi.com", color: "bg-purple-600 hover:bg-purple-700" },
  { label: "CUSTOMER", icon: "material-symbols:beach-access", email: "guest@dtuvivi.com", color: "bg-blue-600 hover:bg-blue-700" },
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const redirect = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("redirect")
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await post("/auth/login", form);
      setToken(res.token);
      if (redirect) {
        router.push(redirect);
      } else if (res.user?.role === "ADMIN" || res.user?.role === "EMPLOYEE") {
        router.push("/admin/dashboard");
      } else {
        router.push("/rooms");
      }
    } catch (err: any) {
      setError(err.body?.message ?? "Đăng nhập thất bại");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780902098/60340468-5c1e-4171-9fc0-98c767b00b26_q3vvbe.png"
            alt="DTUVIVU"
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">DTUVIVU DEVELOPMENT</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Chọn vai trò để đăng nhập nhanh</p>
        </div>

        {/* Quick Login Buttons */}
        <div className="flex gap-3 mb-8">
          {QUICK_LOGINS.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setForm({ email: q.email, password: "123456" })}
              className={`flex-1 flex flex-col items-center gap-1.5 ${q.color} text-white rounded-xl py-4 px-3 transition-all active:scale-95 shadow-sm font-semibold text-body-sm`}
            >
              <Icon icon={q.icon} className="text-2xl" />
              <span>{q.label}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-outline" />
          <span className="text-body-xs text-on-surface-variant">hoặc nhập tay</span>
          <div className="flex-1 h-px bg-outline" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-outline p-8 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-body-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Email</label>
              <input
                className="w-full h-11 border border-outline rounded-lg px-4 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Mật khẩu</label>
              <input
                className="w-full h-11 border border-outline rounded-lg px-4 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                type="password"
                placeholder="••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            className="mt-6 w-full bg-primary hover:bg-primary/95 text-white h-11 rounded-lg font-bold text-body-md transition-all active:scale-95 shadow-sm"
            type="submit"
          >
            Đăng nhập
          </button>

          <div className="mt-4 flex flex-col items-center gap-2 text-body-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">Quên mật khẩu?</Link>
            <div className="text-on-surface-variant">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-primary hover:underline">Đăng ký</Link>
            </div>
          </div>
        </form>

        {/* Dev Hint */}
        <p className="text-center text-body-xs text-on-surface-variant mt-6">
          Tất cả tài khoản đều dùng mật khẩu <strong>123456</strong>
        </p>
      </div>
    </div>
  );
}
