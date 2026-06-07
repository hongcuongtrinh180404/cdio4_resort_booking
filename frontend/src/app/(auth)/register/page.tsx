"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { setToken } from "@/lib/auth";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await post("/auth/register", form);
      setToken(res.token);
      router.push("/rooms");
    } catch (err: any) {
      setError(err.body?.message ?? "Đăng ký thất bại");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-lg border p-8 shadow">
        <h1 className="text-2xl font-bold text-center">Đăng ký</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          className="rounded border p-2"
          placeholder="Họ và tên"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
        <input
          className="rounded border p-2"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="rounded border p-2"
          type="tel"
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="rounded border p-2"
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button className="rounded bg-blue-600 py-2 text-white font-semibold hover:bg-blue-700" type="submit">
          Đăng ký
        </button>
        <p className="text-sm text-center text-gray-600">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
