"use client";

import { useEffect, useState, useCallback } from "react";
import { get } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import Pagination from "@/components/admin/Pagination";

interface Payment {
  id: number;
  amount: number;
  status: string;
  paidAt: string;
  booking: { bookingCode: string; createdAt: string };
}

export default function AdminReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ data: Payment[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/reports/revenue?page=${page}&limit=10`);
      setPayments(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const grandTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Báo cáo doanh thu</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Danh sách các giao dịch thanh toán thành công</p>
      </div>

      {!loading && (
        <div className="bg-white rounded-xl border border-outline p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">payments</span>
            </div>
            <div>
              <p className="text-body-sm text-on-surface-variant">Tổng doanh thu</p>
              <p className="font-headline-md text-headline-md font-bold text-primary">{formatVND(grandTotal)}</p>
              <p className="text-body-xs text-on-surface-variant">{total} giao dịch</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Đang tải...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Chưa có giao dịch nào</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-outline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline text-label-caps text-on-surface-variant font-bold text-[11px] tracking-wider">
                    <th className="p-4 font-bold">Mã booking</th>
                    <th className="p-4 font-bold text-right">Số tiền</th>
                    <th className="p-4 font-bold">Ngày thanh toán</th>
                    <th className="p-4 font-bold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                      <td className="p-4 font-medium text-on-surface">{p.booking.bookingCode}</td>
                      <td className="p-4 text-right font-semibold text-primary">{formatVND(Number(p.amount))}</td>
                      <td className="p-4">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("vi-VN") : "—"}</td>
                      <td className="p-4">
                        <span className="text-label-caps px-3 py-1 rounded-full bg-green-100 text-green-800">
                          Thành công
                        </span>
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
