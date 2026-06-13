"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { get, post, patch, del } from "@/lib/api";
import { getUser, isAuthenticated } from "@/lib/auth";
import { formatVND } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";

type TabKey = "info" | "password" | "wishlist" | "bookings";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "info", label: "Thông tin tài khoản", icon: "person" },
  { key: "password", label: "Đổi mật khẩu", icon: "lock" },
  { key: "wishlist", label: "Yêu thích", icon: "favorite" },
  { key: "bookings", label: "Lịch sử booking", icon: "receipt_long" },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đã nhận phòng",
  CHECKED_OUT: "Đã trả phòng",
  CANCELLED: "Đã hủy",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CHECKED_IN: "bg-blue-100 text-blue-800",
  CHECKED_OUT: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

interface UserProfile {
  id: number; email: string; fullName: string; phone: string | null; address: string | null; role: string;
}

interface WishlistItem {
  id: number;
  room: { id: number; name: string; pricePerNight: number; roomType: { name: string } };
}

interface BookingItem {
  id: number;
  bookingCode: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  totalAmount: number;
  createdAt: string;
  room: { name: string; roomType: { name: string } };
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "success" ? "bg-green-600" : "bg-red-600";
  const icon = type === "success" ? "check_circle" : "error";
  return (
    <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 ${bg} text-white px-5 py-3 rounded-xl shadow-lg text-body-sm font-semibold animate-slide-in`}>
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
      <style>{`@keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } .animate-slide-in { animation: slide-in 0.3s ease-out; }`}</style>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("info");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    get<UserProfile>("/users/me").then((p) => { setProfile(p); setFullName(p.fullName); setPhone(p.phone ?? ""); setAddress(p.address ?? ""); });
  }, [router]);

  const showToast = useCallback((msg: string, type: "success" | "error") => setToast({ msg, type }), []);

  const fetchWishlist = useCallback(async () => {
    try { setWishlist(await get<WishlistItem[]>("/wishlist")); } catch { showToast("Không thể tải danh sách yêu thích", "error"); }
  }, [showToast]);

  const fetchBookings = useCallback(async () => {
    try { setBookings(await get<BookingItem[]>("/bookings/my")); } catch { showToast("Không thể tải lịch sử booking", "error"); }
  }, [showToast]);

  useEffect(() => {
    if (tab === "wishlist" && !wishlist.length) fetchWishlist();
    if (tab === "bookings" && !bookings.length) fetchBookings();
  }, [tab, wishlist.length, bookings.length, fetchWishlist, fetchBookings]);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const updated = await patch<UserProfile>("/users/me", { fullName, phone, address });
      setProfile(updated);
      showToast("Cập nhật thông tin thành công", "success");
    } catch { showToast("Cập nhật thất bại", "error"); } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { showToast("Mật khẩu mới không khớp", "error"); return; }
    setChangingPwd(true);
    try {
      await patch("/users/me/password", { currentPassword, newPassword });
      showToast("Đổi mật khẩu thành công", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      const msg = e?.body?.message?.[0] || e?.body?.message || "Đổi mật khẩu thất bại";
      showToast(msg, "error");
    } finally { setChangingPwd(false); }
  };

  const handleCancelBooking = async (b: BookingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc chắn muốn hủy đặt phòng "${b.room.name}"?`)) return;
    setCancellingId(b.id);
    try {
      const res = await patch<{ message: string; refunded: boolean; refundAmount: number }>(`/bookings/${b.id}/cancel`);
      if (res.refunded) {
        showToast(`Hủy thành công! Tiền hoàn: ${formatVND(res.refundAmount)}`, "success");
      } else {
        showToast("Hủy thành công!", "success");
      }
      fetchBookings();
    } catch (err: any) {
      showToast(err?.body?.message ?? "Hủy thất bại", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const removeWishlist = async (roomId: number) => {
    try {
      await del(`/wishlist/${roomId}`);
      setWishlist(wishlist.filter((i) => i.room.id !== roomId));
    } catch { showToast("Xoá thất bại", "error"); }
  };

  if (!profile) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-body-md text-on-surface-variant">Đang tải...</div>
    </div>
  );

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-6 md:py-10">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="bg-surface rounded-xl border border-outline p-2 flex md:flex-col gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-body-md transition-colors whitespace-nowrap ${
                  tab === t.key ? "bg-primary/10 text-primary font-semibold" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{t.icon}</span>
                <span className="hidden md:inline">{t.label}</span>
                <span className="md:hidden text-sm">{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Tab: Info */}
          {tab === "info" && (
            <div className="bg-surface rounded-xl border border-outline p-6 md:p-8">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-6">Thông tin tài khoản</h2>
              <div className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Email</label>
                  <input value={profile.email} disabled className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-gray-50 text-on-surface-variant cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Họ tên</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Số điện thoại</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Địa chỉ</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <button onClick={handleUpdateProfile} disabled={saving} className="bg-primary hover:bg-primary/95 text-white px-6 py-2.5 rounded-full font-label-caps text-label-caps transition-all active:scale-95 disabled:opacity-50">
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Password */}
          {tab === "password" && (
            <div className="bg-surface rounded-xl border border-outline p-6 md:p-8">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-6">Đổi mật khẩu</h2>
              <div className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Mật khẩu hiện tại</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Mật khẩu mới</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Xác nhận mật khẩu mới</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <button onClick={handleChangePassword} disabled={changingPwd} className="bg-primary hover:bg-primary/95 text-white px-6 py-2.5 rounded-full font-label-caps text-label-caps transition-all active:scale-95 disabled:opacity-50">
                  {changingPwd ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Wishlist */}
          {tab === "wishlist" && (
            <div className="bg-surface rounded-xl border border-outline p-6 md:p-8">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-6">Phòng yêu thích</h2>
              {wishlist.length === 0 ? (
                <p className="text-body-md text-on-surface-variant">Chưa có phòng nào.</p>
              ) : (
                <div className="space-y-3">
                  {wishlist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white rounded-lg border border-outline p-4">
                      <div>
                        <Link href={`/rooms/${item.room.id}`} className="font-semibold text-primary hover:underline">
                          {item.room.name}
                        </Link>
                        <p className="text-body-sm text-on-surface-variant">{item.room.roomType.name}</p>
                      </div>
                      <button onClick={() => removeWishlist(item.room.id)} className="flex items-center gap-1 text-sm text-error hover:underline">
                        <span className="material-symbols-outlined text-base">delete</span>
                        Xoá
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Bookings */}
          {tab === "bookings" && (
            <div className="bg-surface rounded-xl border border-outline p-6 md:p-8">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-6">Lịch sử booking</h2>
              {bookings.length === 0 ? (
                <p className="text-body-md text-on-surface-variant">Chưa có booking nào.</p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => {
                    const hoursSinceCreation = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60);
                    const isEmployeeOrAdmin = profile?.role === "EMPLOYEE" || profile?.role === "ADMIN";
                    const canCancel = isEmployeeOrAdmin
                      ? (b.status === "PENDING" || b.status === "CONFIRMED")
                      : (b.status === "PENDING" || (b.status === "CONFIRMED" && hoursSinceCreation <= 24));
                    return (
                      <div key={b.id} className="bg-white rounded-lg border border-outline p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div onClick={() => router.push(`/bookings/${b.id}`)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="font-semibold text-on-surface">{b.room.name}</p>
                            <p className="text-body-sm text-on-surface-variant">{b.bookingCode}</p>
                            <p className="text-body-sm text-on-surface-variant">
                              {format(new Date(b.checkInDate), "dd/MM/yyyy", { locale: vi })} → {format(new Date(b.checkOutDate), "dd/MM/yyyy", { locale: vi })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-label-caps px-3 py-1 rounded-full ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-800"}`}>
                              {STATUS_LABEL[b.status] || b.status}
                            </span>
                            <span className="font-bold text-body-md text-primary">{formatVND(b.totalAmount)}</span>
                          </div>
                        </div>
                        {canCancel && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={(e) => handleCancelBooking(b, e)}
                              disabled={cancellingId === b.id}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-body-sm transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                              style={{ backgroundColor: "#FA6781", color: "white" }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#E55A6F"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FA6781"}
                            >
                              <span className="material-symbols-outlined text-sm">cancel</span>
                              {cancellingId === b.id ? "Đang xử lý..." : "Hủy đặt phòng"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
