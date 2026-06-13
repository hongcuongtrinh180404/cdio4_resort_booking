"use client";

import { useEffect, useState, useCallback } from "react";
import { get, post, patch, del } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import Pagination from "@/components/admin/Pagination";
import { Icon } from "@iconify/react";

interface RoomType {
  id: number;
  name: string;
}

interface RoomImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

interface Room {
  id: number;
  name: string;
  roomNumber: string;
  status: string;
  capacity: number;
  pricePerNight: number;
  description: string | null;
  roomType: RoomType;
  images: RoomImage[];
}

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Có sẵn",
  OCCUPIED: "Đang ở",
  MAINTENANCE: "Bảo trì",
  INACTIVE: "Ngưng hoạt động",
};

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  OCCUPIED: "bg-blue-100 text-blue-800",
  MAINTENANCE: "bg-yellow-100 text-yellow-800",
  INACTIVE: "bg-red-100 text-red-800",
};

const STATUS_OPTIONS = ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "INACTIVE"];

const emptyForm = {
  name: "",
  roomNumber: "",
  roomTypeId: 0,
  description: "",
  capacity: 2,
  pricePerNight: "",
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

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRooms = useCallback(async () => {
    try {
      const [res, rt] = await Promise.all([
        get<{ data: Room[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/rooms?page=${page}&limit=10`),
        get<RoomType[]>("/room-types"),
      ]);
      setRooms(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      setRoomTypes(rt);
    } catch {
      setToast({ msg: "Không thể tải danh sách phòng", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const openAddModal = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setNewImageUrl("");
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      roomNumber: room.roomNumber,
      roomTypeId: room.roomType.id,
      description: room.description ?? "",
      capacity: room.capacity,
      pricePerNight: String(Number(room.pricePerNight)),
    });
    setNewImageUrl("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.roomNumber || !form.roomTypeId) {
      setToast({ msg: "Vui lòng điền đầy đủ thông tin", type: "error" });
      return;
    }
    const pricePerNight = Number(form.pricePerNight);
    if (isNaN(pricePerNight) || pricePerNight <= 0) {
      setToast({ msg: "Giá/đêm phải là số dương", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, pricePerNight };
      if (editingRoom) {
        await patch(`/rooms/${editingRoom.id}`, payload);
        setToast({ msg: "Cập nhật phòng thành công", type: "success" });
      } else {
        await post("/rooms", payload);
        setToast({ msg: "Thêm phòng thành công", type: "success" });
      }
      setModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      setToast({ msg: err?.body?.message ?? "Lưu thất bại", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (roomId: number, status: string) => {
    try {
      await patch(`/rooms/${roomId}/status`, { status });
      setToast({ msg: "Cập nhật trạng thái thành công", type: "success" });
      fetchRooms();
    } catch (err: any) {
      setToast({ msg: err?.body?.message ?? "Cập nhật thất bại", type: "error" });
    }
  };

  const handleAddImage = async () => {
    if (!editingRoom || !newImageUrl.trim()) return;
    try {
      await post(`/rooms/${editingRoom.id}/images`, { imageUrl: newImageUrl.trim() });
      setNewImageUrl("");
      setToast({ msg: "Thêm ảnh thành công", type: "success" });
      const updated = await get<Room>(`/rooms/${editingRoom.id}`);
      setEditingRoom(updated);
      fetchRooms();
    } catch (err: any) {
      setToast({ msg: err?.body?.message ?? "Thêm ảnh thất bại", type: "error" });
    }
  };

  const handleRemoveImage = async (imageId: number) => {
    if (!editingRoom) return;
    try {
      await del(`/rooms/images/${imageId}`);
      setToast({ msg: "Xoá ảnh thành công", type: "success" });
      const updated = await get<Room>(`/rooms/${editingRoom.id}`);
      setEditingRoom(updated);
      fetchRooms();
    } catch {
      setToast({ msg: "Xoá ảnh thất bại", type: "error" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setModalOpen(false);
  };

  /* ===== Modal ===== */
  const Modal = () => {
    if (!modalOpen) return null;
    const title = editingRoom ? "Sửa thông tin phòng" : "Thêm phòng mới";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)} onKeyDown={handleKeyDown}>
        <div className="bg-white rounded-xl border border-outline shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-outline">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{title}</h2>
            <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-surface-container rounded-full transition-colors">
              <Icon icon="material-symbols:close" className="text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Tên phòng</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" required />
              </div>
              <div>
                <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Số phòng</label>
                <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" required />
              </div>
              <div>
                <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Loại phòng</label>
                <select value={form.roomTypeId} onChange={(e) => setForm({ ...form, roomTypeId: Number(e.target.value) })} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                  <option value={0}>Chọn loại phòng</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Sức chứa (người)</label>
                <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Giá/đêm (VNĐ)</label>
                <input type="text" inputMode="decimal" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" required />
              </div>
            </div>
            <div>
              <label className="block text-label-caps text-on-surface-variant font-bold mb-1.5 tracking-wider">Mô tả</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-outline rounded-lg px-3 py-2 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none" />
            </div>

            {/* Images section (edit mode only) */}
            {editingRoom && (
              <div>
                <label className="block text-label-caps text-on-surface-variant font-bold mb-2 tracking-wider">Ảnh phòng</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {editingRoom.images.map((img) => (
                    <div key={img.id} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-outline">
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon icon="material-symbols:delete" className="text-white text-xl" />
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
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddImage(); } }}
                  />
                  <button onClick={handleAddImage} className="h-10 px-4 bg-primary hover:bg-primary/95 text-white rounded-lg font-semibold text-body-sm transition-all active:scale-95 shrink-0">
                    Thêm
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-outline">
            <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-outline text-on-surface font-semibold text-body-sm hover:bg-surface-container-low transition-all">
              Huỷ
            </button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-lg font-bold text-body-sm transition-all active:scale-95 disabled:opacity-50">
              {saving ? "Đang lưu..." : editingRoom ? "Cập nhật" : "Thêm phòng"}
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
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Quản lý phòng</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Thêm, sửa thông tin và quản lý trạng thái phòng</p>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg font-semibold text-body-sm transition-all active:scale-95 shadow-sm">
          <Icon icon="material-symbols:add" className="text-lg" />
          Thêm phòng
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Đang tải...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Không có phòng nào</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-outline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline text-label-caps text-on-surface-variant font-bold text-[11px] tracking-wider">
                    <th className="p-4 font-bold">Phòng</th>
                    <th className="p-4 font-bold">Số phòng</th>
                    <th className="p-4 font-bold">Loại</th>
                    <th className="p-4 font-bold text-right">Sức chứa</th>
                    <th className="p-4 font-bold text-right">Giá/đêm</th>
                    <th className="p-4 font-bold text-center">Trạng thái</th>
                    <th className="p-4 font-bold text-center">Ảnh</th>
                    <th className="p-4 font-bold text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline">
                  {rooms.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                      <td className="p-4 font-medium text-on-surface">{r.name}</td>
                      <td className="p-4">{r.roomNumber}</td>
                      <td className="p-4">{r.roomType.name}</td>
                      <td className="p-4 text-right">{r.capacity} người</td>
                      <td className="p-4 text-right font-medium">{formatVND(Number(r.pricePerNight))}</td>
                      <td className="p-4 text-center">
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className={`text-label-caps px-2 py-1 rounded-full border-0 font-semibold outline-none cursor-pointer ${STATUS_COLOR[r.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center -space-x-2">
                          {r.images.slice(0, 3).map((img) => (
                            <img key={img.id} src={img.imageUrl} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                          ))}
                          {r.images.length > 3 && (
                            <span className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 text-body-xs flex items-center justify-center text-on-surface-variant font-medium">
                              +{r.images.length - 3}
                            </span>
                          )}
                          {r.images.length === 0 && (
                            <span className="text-body-xs text-on-surface-variant">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openEditModal(r)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-body-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
                        >
                          <Icon icon="material-symbols:edit" className="text-sm" />
                          Sửa
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
