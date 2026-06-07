"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const responseCode = searchParams.get("vnp_ResponseCode");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border p-8 text-center shadow">
        {responseCode === "00" ? (
          <>
            <h1 className="text-2xl font-bold text-green-600">Thanh toán thành công!</h1>
            <p className="mt-2 text-gray-600">Cảm ơn bạn đã đặt phòng tại DTUVIVI Resort.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-red-600">Thanh toán thất bại</h1>
            <p className="mt-2 text-gray-600">Mã lỗi: {responseCode}</p>
          </>
        )}
        <Link href="/bookings" className="mt-4 inline-block text-blue-600 hover:underline">
          Xem booking của tôi
        </Link>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Đang tải...</div>}>
      <PaymentReturnContent />
    </Suspense>
  );
}
