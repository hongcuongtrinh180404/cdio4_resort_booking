"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import { hasRole } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Payment {
  id: number;
  amount: number;
  status: string;
  paidAt: string;
  booking: { bookingCode: string; createdAt: string };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!hasRole("EMPLOYEE", "ADMIN")) { router.push("/"); return; }
    get<Payment[]>("/admin/reports/revenue").then(setPayments);
  }, [router]);

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Báo cáo doanh thu</h1>
      <p className="mb-4 text-lg">Tổng doanh thu: <strong>{total.toLocaleString("vi-VN")} VND</strong></p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Mã booking</th>
            <th className="p-2">Số tiền</th>
            <th className="p-2">Ngày thanh toán</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.booking.bookingCode}</td>
              <td className="p-2">{Number(p.amount).toLocaleString("vi-VN")} VND</td>
              <td className="p-2">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("vi-VN") : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
