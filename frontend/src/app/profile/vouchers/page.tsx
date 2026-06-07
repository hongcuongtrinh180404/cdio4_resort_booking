"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import Link from "next/link";

interface Voucher {
  id: number;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    get<Voucher[]>("/vouchers").then(setVouchers);
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Voucher</h1>
      <div className="space-y-4">
        {vouchers.filter((v) => v.isActive).map((v) => (
          <div key={v.id} className="rounded-lg border p-4">
            <p className="font-bold text-lg">{v.code}</p>
            <p className="text-sm text-gray-600">{v.description}</p>
            <p className="text-sm">{v.discountType === "PERCENTAGE" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString("vi-VN")} VND`}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
