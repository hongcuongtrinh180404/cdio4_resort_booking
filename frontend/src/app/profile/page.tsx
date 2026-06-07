"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api";
import { getUser, isAuthenticated } from "@/lib/auth";
import Link from "next/link";

interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    const user = getUser();
    if (user) get<UserProfile>(`/users/${user.sub}`).then(setProfile);
  }, [router]);

  if (!profile) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Thông tin cá nhân</h1>
      <div className="space-y-2 rounded-lg border p-4">
        <p>Họ tên: <strong>{profile.fullName}</strong></p>
        <p>Email: {profile.email}</p>
        <p>SĐT: {profile.phone ?? "Chưa cập nhật"}</p>
        <p>Vai trò: {profile.role}</p>
      </div>
      <div className="mt-4 flex gap-4">
        <Link href="/profile/bookings" className="text-blue-600 hover:underline">Booking của tôi</Link>
        <Link href="/profile/wishlist" className="text-blue-600 hover:underline">Yêu thích</Link>
        <Link href="/profile/vouchers" className="text-blue-600 hover:underline">Voucher</Link>
      </div>
    </div>
  );
}
