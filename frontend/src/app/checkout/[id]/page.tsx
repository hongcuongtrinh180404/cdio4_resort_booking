"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { get, post } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import { Icon } from "@iconify/react";

interface Booking {
  id: number;
  bookingCode: string;
  status: string;
  totalAmount: number;
  room: { name: string; roomType: { name: string } };
  payment: { status: string } | null;
}

interface SePayQrInfo {
  qrUrl: string;
  bankAccount: string;
  bankName: string;
  bankHolder: string;
  amount: number;
  content: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [qrInfo, setQrInfo] = useState<SePayQrInfo | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>(undefined);
  const cancelSentRef = useRef(false);
  const totalTime = 120;
  const [timeLeft, setTimeLeft] = useState(totalTime);

  const cancelCheckout = useCallback(async () => {
    if (cancelSentRef.current) return;
    cancelSentRef.current = true;
    try {
      await post("/payments/sepay/cancel-checkout", { bookingId: Number(params.id) });
    } catch {
      // ignore - backend timeout will clean up
    }
  }, [params.id]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!expired && !cancelSentRef.current) {
        cancelSentRef.current = true;
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/payments/sepay/cancel-checkout`,
          JSON.stringify({ bookingId: Number(params.id) }),
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [params.id, expired]);

  const handleExpired = useCallback(async () => {
    setExpired(true);
    await cancelCheckout();
  }, [cancelCheckout]);

  const handleCancel = async () => {
    setCancelling(true);
    await cancelCheckout();
    router.push(`/bookings/${params.id}`);
  };

  const fetchBooking = useCallback(async () => {
    try {
      const data = await get<Booking>(`/bookings/${params.id}`);
      setBooking(data);
      if (data.status === "CONFIRMED" || data.payment?.status === "PAID") {
        router.push(`/bookings/${params.id}?payment=success`);
      }
    } catch {
      // ignore poll errors
    }
  }, [params.id, router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push(`/login?redirect=${encodeURIComponent(window.location.href)}`); return; }

    Promise.all([
      post<SePayQrInfo>("/payments/sepay/qr", { bookingId: Number(params.id) }),
      get<Booking>(`/bookings/${params.id}`),
    ])
      .then(([qr, bk]) => {
        setQrInfo(qr);
        setBooking(bk);
      })
      .catch(() => router.push("/bookings"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  useEffect(() => {
    if (qrInfo) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleExpired();
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      const poll = setInterval(fetchBooking, 5000);

      return () => {
        clearInterval(timerRef.current);
        clearInterval(poll);
      };
    }
  }, [qrInfo, fetchBooking, handleExpired]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / totalTime) * 100;
  const isLow = timeLeft < 30;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-background relative">
        <div className="glass-card px-8 py-4">
          <div className="text-body-md text-on-surface-variant">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!qrInfo || !booking) return null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#faf8ff] to-[#e8f0fe]">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#2563eb]/5 blur-3xl" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-[#b4c5ff]/10 blur-3xl" />

      {/* TopAppBar */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-max-width mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[#2563eb] flex items-center justify-center shadow-md">
              <Icon icon="material-symbols:payments" className="text-white text-lg" />
            </div>
            <span className="text-headline-sm font-headline-sm font-bold text-primary">QR Checkout</span>
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-all px-4 py-2 rounded-full bg-red-50/80 hover:bg-red-100 border border-red-200/50 text-label-md font-label-md font-semibold"
          >
            <Icon icon="material-symbols:close" className="text-lg" />
            Huỷ
          </button>
        </div>
      </nav>

      {expired ? (
        <main className="flex-grow flex items-center justify-center px-margin-mobile md:px-margin-desktop py-lg relative z-10">
          <div className="glass-card max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
              <Icon icon="material-symbols:timer-off-outline" className="text-4xl text-red-400" />
            </div>
            <h2 className="text-headline-md font-headline-md font-bold mb-2 text-on-surface">
              Phiên thanh toán đã hết hạn
            </h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Thời gian thanh toán đã hết. Vui lòng quay lại để thực hiện lại giao dịch.
            </p>
            <button
              onClick={() => router.push(`/bookings/${params.id}`)}
              className="btn-primary w-full"
            >
              <Icon icon="material-symbols:arrow-back" />
              Quay lại
            </button>
          </div>
        </main>
      ) : (
        <main className="flex-grow w-full max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-6 md:py-lg space-y-6 md:space-y-lg relative z-10">
          {/* Header Card */}
          <div className="glass-card text-center">
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-4">
              <Icon icon="material-symbols:shopping-cart-checkout" className="text-primary text-sm" />
              <span className="text-label-md font-label-md text-primary font-semibold">
                Đơn hàng #{booking.bookingCode}
              </span>
            </div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface mb-1">
              {booking.room.roomType.name}
            </h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant mb-5">
              {booking.room.name}
            </p>
            <div className="w-full max-w-md mx-auto bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex justify-between items-center mb-3">
                <span className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1.5">
                  <Icon icon="material-symbols:schedule" className="text-lg" />
                  Thời gian còn lại
                </span>
                <span className={`text-headline-sm font-headline-sm font-bold tabular-nums ${isLow ? "text-[#f57f17]" : "text-primary"}`}>
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-variant/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    isLow ? "bg-gradient-to-r from-[#f57f17] to-[#ef5350]" : "bg-gradient-to-r from-primary to-[#2563eb]"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-gutter">
            {/* Left: QR */}
            <div className="md:col-span-5 flex flex-col gap-6">
              <div className="glass-card flex flex-col items-center">
                <h2 className="text-headline-md font-headline-md text-on-surface mb-5 text-center">
                  Quét mã QR để thanh toán
                </h2>
                <div className="relative p-3 rounded-2xl bg-white border border-white/40 shadow-[0_0_40px_rgba(0,74,198,0.06)] mb-5">
                  <div className="relative w-[240px] h-[240px] flex items-center justify-center overflow-hidden z-10 rounded-xl bg-white">
                    <img
                      src={qrInfo.qrUrl}
                      alt="QR chuyển khoản"
                      className="w-full h-full object-contain"
                    />
                    <div className="qr-scan-line" />
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary/70 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary/70 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary/70 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary/70 rounded-br-xl" />
                  </div>
                  <div className="flex justify-center -mb-2 mt-3">
                    <div className="bg-white/95 backdrop-blur-md border border-white/50 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Icon icon="material-symbols:verified-user" className="text-[15px] text-primary" />
                      <span className="text-label-sm font-label-sm text-on-surface-variant font-medium">
                        VietQR
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-primary/5 px-5 py-3 rounded-full border border-primary/10">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                  </span>
                  <span className="text-label-md font-label-md text-on-surface font-medium">
                    Đang chờ thanh toán...
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Info */}
            <div className="md:col-span-7 flex flex-col gap-6">
              <div className="glass-card">
                <h2 className="text-headline-md font-headline-md text-on-surface mb-5">
                  Thông tin thanh toán
                </h2>
                <div className="space-y-3">
                  <InfoRow
                    label="Số tiền thanh toán"
                    value={formatVND(qrInfo.amount)}
                    highlight
                    onCopy={() => copyText(String(qrInfo.amount))}
                  />
                  <InfoRow
                    label="Nội dung chuyển khoản"
                    value={qrInfo.content}
                    onCopy={() => copyText(qrInfo.content)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="glass-card-inner">
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Ngân hàng</span>
                      <div className="flex items-center gap-2.5 mt-1">
                        <img
                          src="https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1782051497/mbbank-logo-5_xhtarn.png"
                          alt="MB Bank"
                          className="w-9 h-9 rounded-lg object-contain bg-white border border-gray-200 shadow-sm shrink-0"
                        />
                        <span className="text-body-md font-body-md font-semibold text-on-surface">{qrInfo.bankName}</span>
                      </div>
                    </div>
                    <div className="glass-card-inner">
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Tên tài khoản</span>
                      <span className="text-body-md font-body-md font-semibold text-on-surface mt-1">{qrInfo.bankHolder}</span>
                    </div>
                  </div>
                  <InfoRow
                    label="Số tài khoản"
                    value={qrInfo.bankAccount}
                    monospace
                    onCopy={() => copyText(qrInfo.bankAccount)}
                  />
                </div>

                <div className="mt-5 bg-[#fff9c4]/70 backdrop-blur-sm border border-[#fbc02d]/30 rounded-xl p-4 flex gap-3 items-start">
                  <Icon icon="material-symbols:info" className="text-[#f57f17] shrink-0 mt-0.5 text-lg" />
                  <p className="text-body-sm font-body-sm text-[#827717]">
                    <strong className="font-semibold block mb-1">Lưu ý quan trọng:</strong>
                    Vui lòng chuyển khoản đúng số tiền và đúng nội dung thanh toán để hệ thống
                    tự động xác nhận giao dịch.
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="glass-card">
                <h3 className="text-headline-sm font-headline-sm text-on-surface mb-6">
                  Hướng dẫn thanh toán
                </h3>
                <div className="space-y-0">
                  {[
                    { num: 1, title: "Mở ứng dụng ngân hàng", desc: "Đăng nhập vào ứng dụng Mobile Banking của bạn." },
                    { num: 2, title: "Chọn tính năng Quét mã QR", desc: "Tìm biểu tượng QR Pay trên màn hình chính." },
                    { num: 3, title: "Quét mã QR", desc: "Di chuyển camera quét mã QR hiển thị bên trái màn hình." },
                    { num: 4, title: "Kiểm tra thông tin", desc: "Đảm bảo số tiền và nội dung thanh toán trùng khớp." },
                    { num: 5, title: "Xác nhận thanh toán", desc: "Nhập mã PIN hoặc xác thực sinh trắc học để hoàn tất." },
                    { num: 6, title: "Chờ hệ thống xác nhận", desc: "Giao dịch sẽ được cập nhật tự động trong giây lát." },
                  ].map((item, i) => (
                    <div key={item.num} className="flex gap-4 relative pb-6 last:pb-0">
                      {/* Vertical line */}
                      {i < 5 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 to-primary/10" />
                      )}
                      {/* Number circle */}
                      <div
                        className={`relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 border-2 ${
                          i === 0
                            ? "bg-gradient-to-br from-primary to-[#2563eb] text-white border-primary/20 shadow-[0_0_16px_rgba(0,74,198,0.25)]"
                            : "bg-white text-on-surface-variant border-outline-variant"
                        }`}
                      >
                        {item.num}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <h4 className={`text-label-md font-label-md font-semibold mb-0.5 ${
                          i === 0 ? "text-primary" : "text-on-surface"
                        }`}>
                          {item.title}
                        </h4>
                        <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel button */}
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-3.5 rounded-xl font-bold text-body-md transition-all active:scale-[0.98] disabled:opacity-50
                  bg-white/70 backdrop-blur-md border-2 border-red-200/60 text-red-500
                  hover:bg-red-50 hover:border-red-300/80
                  flex items-center justify-center gap-2 shadow-sm"
              >
                <Icon icon="material-symbols:cancel-outline" className="text-xl" />
                {cancelling ? "Đang hủy..." : "Hủy thanh toán"}
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="relative z-10 bg-white/40 backdrop-blur-xl border-t border-white/20 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-6 max-w-max-width mx-auto gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 text-label-md font-label-md font-semibold text-secondary">
              <Icon icon="material-symbols:shield" className="text-lg" />
              DTUVIVU - Thanh toán an toàn
            </div>
            <p className="text-body-sm font-body-sm text-on-secondary-container/70">
              Giao dịch được xác nhận tự động qua SePay.
            </p>
          </div>
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Hệ thống đang hoạt động
          </div>
        </div>
      </footer>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.35);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
          border-radius: 16px;
          padding: 24px;
        }
        .glass-card-inner {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #004ac6, #2563eb);
          color: white;
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          transition: all 0.15s;
          box-shadow: 0 4px 16px rgba(0, 74, 198, 0.2);
        }
        .btn-primary:hover {
          box-shadow: 0 6px 24px rgba(0, 74, 198, 0.3);
          transform: translateY(-1px);
        }
        .btn-primary:active {
          transform: scale(0.98);
        }
        .qr-scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0, 74, 198, 0.6), transparent);
          box-shadow: 0 0 12px rgba(0, 74, 198, 0.3);
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes scan {
          0% { top: 5%; opacity: 0; }
          10% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 95%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
  monospace,
  onCopy,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  monospace?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="glass-card-inner flex-row justify-between items-center gap-3">
      <span className="text-label-md font-label-md text-on-surface-variant shrink-0">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`text-right ${highlight ? "text-headline-lg font-headline-lg text-primary" : "text-body-lg font-body-lg font-semibold text-on-surface"} ${monospace ? "tracking-wider font-mono" : ""}`}
        >
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="shrink-0 text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-white/60 bg-white/40 border border-white/30"
            title="Sao chép"
          >
            <Icon icon="material-symbols:content-copy" className="text-lg" />
          </button>
        )}
      </div>
    </div>
  );
}
