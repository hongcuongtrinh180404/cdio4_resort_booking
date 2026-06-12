"use client";

import { useEffect, useState, useCallback } from "react";
import { get } from "@/lib/api";
import Pagination from "@/components/admin/Pagination";

interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  createdAt: string;
  _count: { bookings: number };
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 ${type === "success" ? "bg-green-600" : "bg-red-600"} text-white px-5 py-3 rounded-xl shadow-lg text-body-sm font-semibold animate-slide-in`}>
      <span className="material-symbols-outlined text-lg">{type === "success" ? "check_circle" : "error"}</span>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><span className="material-symbols-outlined text-lg">close</span></button>
      <style>{`@keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } .animate-slide-in { animation: slide-in 0.3s ease-out; }`}</style>
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  GUEST: "Khách",
  EMPLOYEE: "Nhân viên",
  ADMIN: "Quản trị viên",
};

const ROLE_COLOR: Record<string, string> = {
  GUEST: "bg-blue-100 text-blue-800",
  EMPLOYEE: "bg-purple-100 text-purple-800",
  ADMIN: "bg-red-100 text-red-800",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ data: User[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/users?page=${page}&limit=10`);
      setUsers(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      setToast({ msg: "Không thể tải danh sách khách hàng", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Khách hàng</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Danh sách người dùng đã đăng ký</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Đang tải...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Không có người dùng nào</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-outline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline text-label-caps text-on-surface-variant font-bold text-[11px] tracking-wider">
                    <th className="p-4 font-bold">Họ tên</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Số điện thoại</th>
                    <th className="p-4 font-bold text-center">Vai trò</th>
                    <th className="p-4 font-bold text-center">Số booking</th>
                    <th className="p-4 font-bold">Ngày đăng ký</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                      <td className="p-4 font-medium text-on-surface">{u.fullName}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4">{u.phone ?? "—"}</td>
                      <td className="p-4 text-center">
                        <span className={`text-label-caps px-3 py-1 rounded-full ${ROLE_COLOR[u.role] || "bg-gray-100 text-gray-800"}`}>
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                      </td>
                      <td className="p-4 text-center font-medium">{u._count.bookings}</td>
                      <td className="p-4">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
