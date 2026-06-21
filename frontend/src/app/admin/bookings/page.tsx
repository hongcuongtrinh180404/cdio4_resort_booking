"use client";

import { useEffect, useState, useCallback } from "react";
import { get, patch } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Icon } from "@iconify/react";
import Pagination from "@/components/admin/Pagination";

interface RoomType {
  id: number;
  name: string;
}

interface BookingItem {
  id: number;
  bookingCode: string;
  status: string;
  user: { id: number; email: string; fullName: string; phone: string | null };
  room: { id: number; name: string; roomNumber: string; roomType: { id: number; name: string } };
  totalAmount: number;
  createdAt: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  payment: { status: string; transactionRef: string; amount: number } | null;
}

interface BookingDetail extends BookingItem {
  specialRequests: string | null;
  roomPricePerNight: number;
  serviceTotal: number;
  comboTotal: number;
  services: { service: { name: string }; quantity: number; priceSnapshot: number }[];
  combos: { combo: { name: string }; quantity: number; comboPriceSnapshot: number }[];
  payment: { status: string; transactionRef: string; amount: number; paidAt: string } | null;
}

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

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 ${type === "success" ? "bg-green-600" : "bg-red-600"} text-white px-5 py-3 rounded-xl shadow-lg text-body-sm font-semibold`}>
      <Icon icon={type === "success" ? "material-symbols:check-circle" : "material-symbols:error"} className="text-lg" />
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><Icon icon="material-symbols:close" className="text-lg" /></button>
      <style>{`@keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } .animate-slide-in { animation: slide-in 0.3s ease-out; }`}</style>
    </div>
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [checkInFrom, setCheckInFrom] = useState("");
  const [checkInTo, setCheckInTo] = useState("");
  const [checkOutFrom, setCheckOutFrom] = useState("");
  const [checkOutTo, setCheckOutTo] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    if (checkInFrom) params.set("checkInFrom", checkInFrom);
    if (checkInTo) params.set("checkInTo", checkInTo);
    if (checkOutFrom) params.set("checkOutFrom", checkOutFrom);
    if (checkOutTo) params.set("checkOutTo", checkOutTo);
    if (roomTypeId) params.set("roomTypeId", roomTypeId);
    params.set("page", String(page));
    params.set("limit", "10");
    return params.toString();
  }, [statusFilter, search, checkInFrom, checkInTo, checkOutFrom, checkOutTo, roomTypeId, page]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      const [res, rt] = await Promise.all([
        get<{ data: BookingItem[]; total: number; page: number; limit: number; totalPages: number }>(`/bookings?${qs}`),
        get<RoomType[]>("/room-types"),
      ]);
      setBookings(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      setRoomTypes(rt);
    } catch {
      setToast({ msg: "Không thể tải danh sách booking", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await get<BookingDetail>(`/admin/bookings/${id}`);
      setDetail(d);
    } catch {
      setToast({ msg: "Không thể tải chi tiết booking", type: "error" });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    setActionId(id);
    try {
      await patch(`/bookings/${id}/cancel`);
      setToast({ msg: "Hủy booking thành công", type: "success" });
      if (detail?.id === id) openDetail(id);
      fetchBookings();
    } catch (err: any) {
      setToast({ msg: err?.body?.message ?? "Hủy thất bại", type: "error" });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Quản lý booking</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Theo dõi và xử lý đặt phòng</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline text-body-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all">
          <Icon icon="material-symbols:tune" className="text-lg" />
          {showFilters ? "Ẩn lọc" : "Lọc nâng cao"}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <Icon icon="material-symbols:search" className="text-lg" />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); } }}
            placeholder="Tìm theo mã booking, tên khách hàng..."
            className="w-full h-11 pl-10 pr-4 border border-outline rounded-xl text-body-sm bg-white text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-outline p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-label-caps text-on-surface-variant font-bold mb-1 tracking-wider text-[11px]">Trạng thái</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-white text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none">
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ thanh toán</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="CHECKED_IN">Đã nhận phòng</option>
              <option value="CHECKED_OUT">Đã trả phòng</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
          <div>
            <label className="block text-label-caps text-on-surface-variant font-bold mb-1 tracking-wider text-[11px]">Check-in từ</label>
            <input type="date" value={checkInFrom} onChange={(e) => setCheckInFrom(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-white text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-label-caps text-on-surface-variant font-bold mb-1 tracking-wider text-[11px]">Check-in đến</label>
            <input type="date" value={checkInTo} onChange={(e) => setCheckInTo(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-white text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-label-caps text-on-surface-variant font-bold mb-1 tracking-wider text-[11px]">Check-out từ</label>
            <input type="date" value={checkOutFrom} onChange={(e) => setCheckOutFrom(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-white text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-label-caps text-on-surface-variant font-bold mb-1 tracking-wider text-[11px]">Check-out đến</label>
            <input type="date" value={checkOutTo} onChange={(e) => setCheckOutTo(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-white text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-label-caps text-on-surface-variant font-bold mb-1 tracking-wider text-[11px]">Loại phòng</label>
            <select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-white text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none">
              <option value="">Tất cả</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setPage(1); }} className="w-full h-10 bg-primary hover:bg-primary/95 text-white rounded-lg font-semibold text-body-sm transition-all active:scale-95">
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Đang tải...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Không có booking nào</div>
      ) : (
        <div className="bg-white rounded-xl border border-outline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline text-label-caps text-on-surface-variant font-bold text-[11px] tracking-wider">
                  <th className="p-4 font-bold">Mã booking</th>
                  <th className="p-4 font-bold">Khách hàng</th>
                  <th className="p-4 font-bold">SĐT</th>
                  <th className="p-4 font-bold">Phòng</th>
                  <th className="p-4 font-bold">Nhận phòng</th>
                  <th className="p-4 font-bold">Trả phòng</th>
                  <th className="p-4 font-bold text-right">Tổng tiền</th>
                  <th className="p-4 font-bold text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline">
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => openDetail(b.id)}
                    className="hover:bg-slate-50/50 transition-colors text-body-sm cursor-pointer"
                  >
                    <td className="p-4 font-medium text-on-surface">{b.bookingCode}</td>
                    <td className="p-4">
                      <div className="font-medium text-on-surface">{b.user.fullName}</div>
                      <div className="text-body-xs text-on-surface-variant">{b.user.email}</div>
                    </td>
                    <td className="p-4">{b.user.phone ?? "—"}</td>
                    <td className="p-4">{b.room.name}</td>
                    <td className="p-4">{format(new Date(b.checkInDate), "dd/MM/yyyy", { locale: vi })}</td>
                    <td className="p-4">{format(new Date(b.checkOutDate), "dd/MM/yyyy", { locale: vi })}</td>
                    <td className="p-4 text-right font-semibold text-primary">{formatVND(Number(b.totalAmount))}</td>
                    <td className="p-4 text-center">
                      <span className={`text-label-caps px-3 py-1 rounded-full ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-800"}`}>
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={setPage} />}

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { if (!detailLoading) setDetail(null); }}>
          <div className="bg-white rounded-xl border border-outline shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-outline">
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Chi tiết booking</h2>
                {detail && <p className="text-body-sm text-primary font-mono mt-0.5">{detail.bookingCode}</p>}
              </div>
              <button onClick={() => setDetail(null)} className="p-1 hover:bg-surface-container rounded-full transition-colors">
                <Icon icon="material-symbols:close" className="text-xl" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-12 text-center text-body-md text-on-surface-variant">Đang tải...</div>
            ) : detail ? (
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <section>
                  <h3 className="flex items-center gap-2 text-label-caps text-on-surface-variant font-bold tracking-wider mb-3">
                    <Icon icon="material-symbols:person" className="text-lg" />
                    THÔNG TIN KHÁCH
                  </h3>
                  <div className="bg-surface-container-low rounded-lg p-4 space-y-2 text-body-sm">
                    <div className="flex justify-between"><span className="text-on-surface-variant">Họ tên</span><span className="font-medium text-on-surface">{detail.user.fullName}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Email</span><span>{detail.user.email}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">SĐT</span><span>{detail.user.phone ?? "—"}</span></div>
                  </div>
                </section>

                {/* Stay Info */}
                <section>
                  <h3 className="flex items-center gap-2 text-label-caps text-on-surface-variant font-bold tracking-wider mb-3">
                    <Icon icon="material-symbols:meeting-room" className="text-lg" />
                    THÔNG TIN LƯU TRÚ
                  </h3>
                  <div className="bg-surface-container-low rounded-lg p-4 space-y-2 text-body-sm">
                    <div className="flex justify-between"><span className="text-on-surface-variant">Phòng</span><span className="font-medium text-on-surface">{detail.room.name} ({detail.room.roomNumber})</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Loại phòng</span><span>{detail.room.roomType.name}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Nhận phòng</span><span>{format(new Date(detail.checkInDate), "dd/MM/yyyy HH:mm", { locale: vi })}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Trả phòng</span><span>{format(new Date(detail.checkOutDate), "dd/MM/yyyy HH:mm", { locale: vi })}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Số đêm</span><span>{detail.numberOfNights} đêm</span></div>
                    {detail.specialRequests && (
                      <div className="flex justify-between"><span className="text-on-surface-variant">Yêu cầu đặc biệt</span><span className="text-right max-w-[200px]">{detail.specialRequests}</span></div>
                    )}
                  </div>
                </section>

                {/* Services / Combos */}
                {(detail.services?.length > 0 || detail.combos?.length > 0) && (
                  <section>
                    <h3 className="flex items-center gap-2 text-label-caps text-on-surface-variant font-bold tracking-wider mb-3">
                    <Icon icon="material-symbols:spa" className="text-lg" />
                    DỊCH VỤ / COMBO ĐI KÈM
                    </h3>
                    <div className="bg-surface-container-low rounded-lg p-4 space-y-2 text-body-sm">
                      {detail.services?.map((s, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-on-surface">{s.service.name} x{s.quantity}</span>
                          <span className="font-medium text-on-surface">{formatVND(Number(s.priceSnapshot) * s.quantity)}</span>
                        </div>
                      ))}
                      {detail.combos?.map((c, i) => (
                        <div key={`c-${i}`} className="flex justify-between">
                          <span className="flex items-center gap-1 text-on-surface">
                            <Icon icon="material-symbols:diamond" className="text-[14px] text-primary" />
                            {c.combo.name} x{c.quantity}
                          </span>
                          <span className="font-medium text-on-surface">{formatVND(Number(c.comboPriceSnapshot) * c.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Payment */}
                <section>
                  <h3 className="flex items-center gap-2 text-label-caps text-on-surface-variant font-bold tracking-wider mb-3">
                    <Icon icon="material-symbols:payments" className="text-lg" />
                    THANH TOÁN
                  </h3>
                  <div className="bg-surface-container-low rounded-lg p-4 space-y-2 text-body-sm">
                    <div className="flex justify-between font-semibold">
                      <span className="text-on-surface-variant">Tổng tiền</span>
                      <span className="text-primary font-bold">{formatVND(Number(detail.totalAmount))}</span>
                    </div>
                    {detail.payment ? (
                      <>
                        <div className="flex justify-between"><span className="text-on-surface-variant">Trạng thái</span>
                          <span className={`font-semibold ${detail.payment.status === "PAID" || detail.payment.status === "SUCCESS" ? "text-green-600" : "text-yellow-600"}`}>
                            {detail.payment.status === "PAID" || detail.payment.status === "SUCCESS" ? <><Icon icon="material-symbols:check-circle" className="inline-block align-middle" /> Đã thanh toán</> : detail.payment.status === "PENDING" ? <><Icon icon="material-symbols:hourglass" className="inline-block align-middle" /> Chờ thanh toán</> : <><Icon icon="material-symbols:close" className="inline-block align-middle" /> Thất bại</>}
                          </span>
                        </div>
                        <div className="flex justify-between"><span className="text-on-surface-variant">Mã giao dịch</span><span className="font-mono text-xs">{detail.payment.transactionRef}</span></div>
                        {detail.payment.paidAt && (
                          <div className="flex justify-between"><span className="text-on-surface-variant">Ngày thanh toán</span><span>{format(new Date(detail.payment.paidAt), "dd/MM/yyyy HH:mm", { locale: vi })}</span></div>
                        )}
                      </>
                    ) : (
                      <div className="text-yellow-600 font-semibold"><Icon icon="material-symbols:hourglass" className="inline-block align-middle" /> Chưa thanh toán</div>
                    )}
                  </div>
                </section>

                {/* Actions */}
                {(detail.status === "PENDING" || detail.status === "CONFIRMED") && (
                  <div className="border-t border-outline pt-4">
                    <button
                      onClick={() => handleCancel(detail.id)}
                      disabled={actionId === detail.id}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold text-body-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Icon icon="material-symbols:cancel" className="text-lg" />
                      {actionId === detail.id ? "Đang xử lý..." : "Hủy booking"}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
