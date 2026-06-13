"use client";

import { useEffect, useState, useCallback } from "react";
import { get, post, patch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import Pagination from "@/components/admin/Pagination";
import ChatPanel from "@/components/chat/ChatPanel";
import { Icon } from "@iconify/react";

interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  createdAt: string;
  _count: { bookings: number };
}

interface Conversation {
  id: number;
  userId: number;
  hasUnread: boolean;
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 ${type === "success" ? "bg-green-600" : "bg-red-600"} text-white px-5 py-3 rounded-xl shadow-lg text-body-sm font-semibold animate-slide-in`}>
      <Icon icon={type === "success" ? "material-symbols:check-circle" : "material-symbols:error"} className="text-lg" />
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><Icon icon="material-symbols:close" className="text-lg" /></button>
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

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "", role: "GUEST" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.fullName) { setError("Vui lòng điền đầy đủ thông tin"); return; }
    setSaving(true);
    setError("");
    try {
      await post("/admin/users", { ...form, phone: form.phone || undefined });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.body?.message?.[0] || e.body?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-headline-sm font-bold text-on-surface mb-4">Thêm người dùng</h3>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="space-y-3">
          <input placeholder="Họ tên *" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-outline/40 text-body-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          <input placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-outline/40 text-body-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          <input type="password" placeholder="Mật khẩu *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-outline/40 text-body-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          <input placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-outline/40 text-body-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-outline/40 text-body-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white">
            <option value="GUEST">Khách</option>
            <option value="EMPLOYEE">Nhân viên</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-full border border-outline/40 text-body-sm font-semibold hover:bg-gray-50 transition-colors">Huỷ</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 h-10 rounded-full bg-primary text-on-primary text-body-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
            {saving ? "Đang tạo..." : "Tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleModal({ userId, currentRole, onClose, onUpdated }: { userId: number; currentRole: string; onClose: () => void; onUpdated: () => void }) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (role === currentRole) { onClose(); return; }
    setSaving(true);
    setError("");
    try {
      await patch(`/admin/users/${userId}/role`, { role });
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e.body?.message?.[0] || e.body?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-headline-sm font-bold text-on-surface mb-4">Phân quyền tài khoản</h3>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/40 text-body-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white">
          <option value="GUEST">Khách</option>
          <option value="EMPLOYEE">Nhân viên</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-full border border-outline/40 text-body-sm font-semibold hover:bg-gray-50 transition-colors">Huỷ</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-full bg-primary text-on-primary text-body-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ id: number; name: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [roleTarget, setRoleTarget] = useState<{ id: number; role: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const u = getUser();
      const roleFilter = u?.role === "ADMIN" ? "" : "&role=GUEST";
      const res = await get<{ data: User[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/users?page=${page}&limit=10${roleFilter}`);
      setUsers(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      setToast({ msg: "Không thể tải danh sách người dùng", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchConversations = useCallback(async () => {
    try {
      const convs = await get<any[]>("/admin/chat/conversations");
      setConversations(convs.map((c: any) => ({ id: c.id, userId: c.userId, hasUnread: c.hasUnread })));
    } catch {}
  }, []);

  useEffect(() => { const u = getUser(); setIsAdmin(u?.role === "ADMIN"); }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const hasUnread = (userId: number) => conversations.some((c) => c.userId === userId && c.hasUnread);

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {chatTarget && (
        <ChatPanel userId={chatTarget.id} userName={chatTarget.name} onClose={() => setChatTarget(null)} />
      )}

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => { setToast({ msg: "Tạo người dùng thành công", type: "success" }); fetchUsers(); }} />
      )}

      {roleTarget && (
        <RoleModal userId={roleTarget.id} currentRole={roleTarget.role} onClose={() => setRoleTarget(null)} onUpdated={() => { setToast({ msg: "Cập nhật quyền thành công", type: "success" }); fetchUsers(); }} />
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Quản lý người dùng</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Danh sách người dùng đã đăng ký</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full text-label-caps text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95"
          >
            <Icon icon="material-symbols:add" className="text-lg" />
            Thêm người dùng
          </button>
        )}
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
                    <th className="p-4 font-bold text-center">Tin nhắn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                      <td className="p-4 font-medium text-on-surface">{u.fullName}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4">{u.phone ?? "—"}</td>
                      <td className="p-4 text-center">
                        {isAdmin ? (
                          <button
                            onClick={() => setRoleTarget({ id: u.id, role: u.role })}
                            className={`text-label-caps px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${ROLE_COLOR[u.role] || "bg-gray-100 text-gray-800"}`}
                          >
                            {ROLE_LABEL[u.role] || u.role}
                          </button>
                        ) : (
                          <span className={`text-label-caps px-3 py-1 rounded-full ${ROLE_COLOR[u.role] || "bg-gray-100 text-gray-800"}`}>
                            {ROLE_LABEL[u.role] || u.role}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center font-medium">{u._count.bookings}</td>
                      <td className="p-4">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setChatTarget({ id: u.id, name: u.fullName })}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                          title="Xem tin nhắn"
                        >
                          <Icon icon="material-symbols:notifications" className={`text-xl transition-colors ${hasUnread(u.id) ? "text-yellow-500" : "text-gray-300"}`} />
                          {hasUnread(u.id) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />}
                        </button>
                      </td>
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
