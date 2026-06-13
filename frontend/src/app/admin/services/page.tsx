"use client";

import { useEffect, useState, useCallback } from "react";
import { get, post, patch } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import Pagination from "@/components/admin/Pagination";
import { Icon } from "@iconify/react";

interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrls: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  imageUrls: [] as string[],
};

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

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchServices = useCallback(async () => {
    try {
      const res = await get<{ data: Service[]; total: number; page: number; limit: number; totalPages: number }>(`/services/admin/all?page=${page}&limit=10`);
      setServices(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      setToast({ msg: "Không thể tải danh sách dịch vụ", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openAddModal = () => {
    setEditingService(null);
    setForm(emptyForm);
    setNewImageUrl("");
    setModalOpen(true);
  };

  const openEditModal = (s: Service) => {
    setEditingService(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      price: String(Number(s.price)),
      imageUrls: s.imageUrls ?? [],
    });
    setNewImageUrl("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      setToast({ msg: "Vui lòng điền đầy đủ thông tin", type: "error" });
      return;
    }
    const price = Number(form.price);
    if (isNaN(price) || price <= 0) {
      setToast({ msg: "Giá phải là số dương", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, price };
      if (editingService) {
        await patch(`/services/${editingService.id}`, payload);
        setToast({ msg: "Cập nhật dịch vụ thành công", type: "success" });
      } else {
        await post("/services", payload);
        setToast({ msg: "Thêm dịch vụ thành công", type: "success" });
      }
      setModalOpen(false);
      fetchServices();
    } catch (err: any) {
      setToast({ msg: err?.body?.message ?? "Lưu thất bại", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: Service) => {
    try {
      await patch(`/services/${s.id}`, { isActive: !s.isActive });
      setToast({ msg: s.isActive ? "Đã tạm ngưng dịch vụ" : "Đã kích hoạt dịch vụ", type: "success" });
      fetchServices();
    } catch (err: any) {
      setToast({ msg: err?.body?.message ?? "Cập nhật thất bại", type: "error" });
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    if (form.imageUrls.includes(newImageUrl.trim())) return;
    setForm({ ...form, imageUrls: [...form.imageUrls, newImageUrl.trim()] });
    setNewImageUrl("");
  };

  const handleRemoveImageUrl = (url: string) => {
    setForm({ ...form, imageUrls: form.imageUrls.filter((u) => u !== url) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setModalOpen(false);
  };

  const Modal = () => {
    if (!modalOpen) return null;
    const title = editingService ? "Sửa dịch vụ" : "Thêm dịch vụ mới";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)} onKeyDown={handleKeyDown}>
        <div className="bg-white rounded-xl border border-outline shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-outline">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{title}</h2>
            <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-surface-container rounded-full transition-colors">
              <Icon icon="material-symbols:close" className="text-xl" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Tên dịch vụ</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" required />
            </div>
            <div>
              <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Mô tả</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-outline rounded-lg px-3 py-2 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none" />
            </div>
            <div>
              <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Giá (VNĐ)</label>
              <input type="text" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" required />
            </div>
            <div>
              <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Ảnh</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.imageUrls.map((url) => (
                  <div key={url} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-outline">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => handleRemoveImageUrl(url)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon icon="material-symbols:delete" className="text-white text-lg" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Nhập URL ảnh..."
                  className="flex-1 h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddImageUrl(); } }}
                />
                <button onClick={handleAddImageUrl} className="h-10 px-4 bg-primary hover:bg-primary/95 text-white rounded-lg font-semibold text-body-sm transition-all active:scale-95 shrink-0">
                  Thêm
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-outline">
            <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-outline text-on-surface font-semibold text-body-sm hover:bg-surface-container-low transition-all">
              Huỷ
            </button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-lg font-bold text-body-sm transition-all active:scale-95 disabled:opacity-50">
              {saving ? "Đang lưu..." : editingService ? "Cập nhật" : "Thêm dịch vụ"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {Modal()}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Quản lý dịch vụ</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Thêm, sửa và quản lý các dịch vụ của resort</p>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg font-semibold text-body-sm transition-all active:scale-95 shadow-sm">
          <Icon icon="material-symbols:add" className="text-lg" />
          Thêm dịch vụ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Đang tải...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Không có dịch vụ nào</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-outline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline text-label-caps text-on-surface-variant font-bold text-[11px] tracking-wider">
                    <th className="p-4 font-bold">Dịch vụ</th>
                    <th className="p-4 font-bold">Giá</th>
                    <th className="p-4 font-bold text-center">Trạng thái</th>
                    <th className="p-4 font-bold text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline">
                  {services.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {s.imageUrls && s.imageUrls.length > 0 && (
                            <img src={s.imageUrls[0]} alt="" className="w-10 h-10 rounded-lg object-cover border border-outline shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-on-surface">{s.name}</p>
                            {s.description && (
                              <p className="text-body-xs text-on-surface-variant line-clamp-1">{s.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{formatVND(Number(s.price))}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-caps font-semibold border ${
                          s.isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          <Icon icon={s.isActive ? "material-symbols:check-circle" : "material-symbols:cancel"} className="text-sm" />
                          {s.isActive ? "Hoạt động" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(s)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-body-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
                          >
                            <Icon icon="material-symbols:edit" className="text-sm" />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleToggleActive(s)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-body-xs font-semibold transition-all active:scale-95 ${
                              s.isActive
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            <Icon icon={s.isActive ? "material-symbols:cancel" : "material-symbols:check-circle"} className="text-sm" />
                            {s.isActive ? "Tạm ngưng" : "Hoạt động"}
                          </button>
                        </div>
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