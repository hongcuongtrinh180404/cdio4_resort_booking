import Link from "next/link";

export default function PaymentPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border p-8 text-center shadow">
        <h1 className="text-2xl font-bold">Chuyển hướng thanh toán</h1>
        <p className="mt-4 text-gray-600">Đang chuyển hướng đến VNPay...</p>
        <Link href="/bookings" className="mt-4 inline-block text-blue-600 hover:underline">
          Quay lại
        </Link>
      </div>
    </div>
  );
}
