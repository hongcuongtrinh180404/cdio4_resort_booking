"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { get, post, patch } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import { isAuthenticated, getUser } from "@/lib/auth";

interface Booking {
  id: number;
  bookingCode: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  roomPricePerNight: number;
  serviceTotal: number;
  comboTotal: number;
  totalAmount: number;
  createdAt: string;
  room: {
    name: string;
    roomType: { name: string };
    images: { imageUrl: string }[];
  };
  user: {
    fullName: string;
    email: string;
    phone: string | null;
  };
  services: {
    service: { name: string; description?: string | null };
    quantity: number;
    priceSnapshot: number;
  }[];
  combos: {
    combo: { name: string };
    quantity: number;
    comboPriceSnapshot: number;
  }[];
  payment: {
    status: string;
    paidAt: string;
    transactionRef: string;
  } | null;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const confettiRan = useRef(false);
  const justPaid = searchParams.get("payment") === "success";

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    get<Booking>(`/bookings/${params.id}`)
      .then(setBooking)
      .catch(() => router.push("/bookings"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  useEffect(() => {
    if (booking && justPaid && !confettiRan.current) {
      confettiRan.current = true;
      import("canvas-confetti").then((mod) => {
        const confetti = mod.default;
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#1594D8", "#F5C26B", "#3b82f6", "#10b981"],
        });
        setTimeout(() => {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.4, x: 0.3 },
            colors: ["#1594D8", "#F5C26B"],
          });
        }, 300);
      });
    }
  }, [booking, justPaid]);

  const handlePay = async () => {
    setPaying(true);
    try {
      await post("/payments/mock", { bookingId: booking!.id });
      router.push(`/bookings/${params.id}?payment=success`);
    } catch {
      alert("Thanh toán thất bại");
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy đặt phòng này?")) return;
    setCancelling(true);
    try {
      const res = await patch<{ message: string; refunded: boolean; refundAmount: number }>(`/bookings/${params.id}/cancel`);
      if (res.refunded) {
        alert(`Hủy thành công! Tiền sẽ được hoàn: ${formatVND(res.refundAmount)}`);
      } else {
        alert("Hủy thành công!");
      }
      const updated = await get<Booking>(`/bookings/${params.id}`);
      setBooking(updated);
    } catch (err: any) {
      alert(`Hủy thất bại: ${err?.body?.message ?? err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const copyBookingCode = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-body-md text-on-surface-variant">Đang tải...</div>
      </div>
    );
  if (!booking) return null;

  const { user, room, services, combos, payment } = booking;
  const createdAt = new Date(booking.createdAt);
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const roomSubtotal = Number(booking.roomPricePerNight) * booking.numberOfNights;

  return (
    <>
      {/* Success Banner (only if just paid) */}
      {justPaid && (
        <section className="text-center mb-12 max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pt-4 md:pt-8">
          <div className="mb-6">
            <svg className="mx-auto" width="95" height="95" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
              <circle
                className="success-checkmark__circle"
                cx="26" cy="26" r="25" fill="none"
                stroke="#1594D8" strokeWidth="3" strokeMiterlimit="10"
                strokeDasharray="166" strokeDashoffset="166"
                style={{ animation: "stroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards" }}
              />
              <path
                className="success-checkmark__check"
                fill="none"
                stroke="#1594D8" strokeWidth="4"
                strokeDasharray="48" strokeDashoffset="48"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
                style={{ animation: "stroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.8s forwards" }}
              />
            </svg>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-3">
            Đặt phòng thành công!
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-lg mx-auto">
            Cảm ơn bạn đã lựa chọn DTUVIVU Luxury Resort. Chúng tôi rất hân hạnh được phục vụ bạn.
          </p>
          <div className="inline-flex items-center gap-4 bg-white px-6 py-3 rounded-xl border border-outline shadow-sm mt-6">
            <span className="font-label-caps text-label-caps text-on-surface-variant font-bold">
              MÃ ĐẶT PHÒNG:
            </span>
            <span className="font-headline-sm text-headline-sm text-primary tracking-wider font-bold">
              {booking.bookingCode}
            </span>
            <button
              onClick={copyBookingCode}
              className="p-1.5 hover:bg-surface-container rounded-full transition-colors active:scale-95"
              title="Sao chép mã"
            >
              <span className={`material-symbols-outlined text-xl ${copied ? "text-green-500" : "text-on-surface-variant"}`}>
                {copied ? "check" : "content_copy"}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* Content */}
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left: QR + Guide */}
          <div className="lg:col-span-3 flex flex-col gap-gutter">
            <div className="bg-white rounded-xl border border-outline p-8 flex flex-col items-center text-center shadow-sm">
              <div className="mb-6 relative bg-white p-3 border border-outline rounded-lg shadow-inner">
                <img
                  alt="QR Check-in"
                  className="w-full max-w-[180px] aspect-square object-contain"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0f172a&data=https%3A%2F%2Fdtuvivu.vn%2Fcheckin%3Fid%3D${booking.bookingCode}`}
                />
                <div className="absolute -top-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                </div>
              </div>
              <h3 className="font-headline-sm text-headline-sm mb-2 font-bold text-on-surface">Mã QR Check-in</h3>
              <p className="text-body-sm text-on-surface-variant">
                Quét mã này tại quầy lễ tân để tiến hành nhận phòng nhanh chóng mà không cần khai báo lại.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-outline p-8 shadow-sm">
              <h3 className="font-headline-sm text-headline-sm mb-4 font-bold text-on-surface">Hướng dẫn tiếp theo</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-0.5">mail</span>
                  <span className="text-body-sm text-on-surface-variant">
                    Email xác nhận đã gửi đến <strong>{user.email}</strong>. Quý khách vui lòng kiểm tra hộp thư đến (hoặc thư rác).
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-0.5">schedule</span>
                  <span className="text-body-sm text-on-surface-variant">
                    Thời gian nhận phòng (Check-in) là từ <strong>14:00 ngày {format(checkIn, "dd/MM/yyyy", { locale: vi })}</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-0.5">badge</span>
                  <span className="text-body-sm text-on-surface-variant">
                    Khi đến resort, vui lòng mang theo CMND/CCCD hoặc Hộ chiếu gốc để làm thủ tục đối chiếu.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Invoice */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-xl border border-outline shadow-sm overflow-hidden">
              {/* Invoice Header */}
              <div className="p-8 border-b border-outline flex justify-between items-start gap-4">
                <div>
                  <div className="text-headline-md font-bold text-primary mb-1 tracking-wide font-poppins">DTUVIVU</div>
                  <div className="text-body-sm font-semibold text-on-surface">DTUVIVU Luxury Resort &amp; Spa</div>
                  <div className="text-body-sm text-on-surface-variant">Đại lộ Võ Nguyên Giáp, Phường Khuê Mỹ, Quận Ngũ Hành Sơn, Đà Nẵng</div>
                  <div className="text-body-sm text-on-surface-variant mt-1">Hotline: 1900 1234 | Email: contact@dtuvivu.vn</div>
                </div>
                <div className="text-right">
                  <h2 className="font-headline-sm text-headline-sm uppercase text-on-surface font-bold tracking-tight mb-1">HÓA ĐƠN XÁC NHẬN</h2>
                  <div className="text-body-sm font-bold text-primary">Số phiếu: INV-{booking.bookingCode}</div>
                  <div className="text-body-sm text-on-surface-variant font-medium">
                    Ngày đặt: {format(createdAt, "dd/MM/yyyy HH:mm", { locale: vi })}
                  </div>
                </div>
              </div>

              {/* Invoice Body */}
              <div className="p-8">
                {/* Client & Payment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <span className="block text-label-caps text-on-surface-variant font-bold mb-2 tracking-wider">THÔNG TIN KHÁCH HÀNG</span>
                    <div className="font-body-lg font-bold text-on-surface">{user.fullName}</div>
                    {user.phone && <div className="text-body-sm text-on-surface-variant">SĐT: {user.phone}</div>}
                    <div className="text-body-sm text-on-surface-variant">Email: {user.email}</div>
                  </div>
                  <div className="md:text-right">
                    <span className="block text-label-caps text-on-surface-variant font-bold mb-2 tracking-wider">THANH TOÁN</span>
                    <div className="font-body-lg font-bold text-on-surface">
                      {payment?.transactionRef?.startsWith("MOCK_") ? "Thanh toán tại chỗ" : "Chuyển khoản / Thẻ"}
                    </div>
                    {payment ? (
                      <div className="text-body-sm text-green-600 font-semibold flex md:justify-end items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        {payment.status === "SUCCESS" ? "Đã thanh toán" : payment.status}
                      </div>
                    ) : (
                      <div className="text-body-sm text-yellow-600 font-semibold flex md:justify-end items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                        Chưa thanh toán
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-outline rounded-lg overflow-hidden mb-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline text-label-caps text-on-surface-variant font-bold text-[11px] tracking-wider">
                        <th className="p-4 font-bold">Mô tả dịch vụ</th>
                        <th className="p-4 font-bold text-center">Thời gian</th>
                        <th className="p-4 font-bold text-center">Số lượng</th>
                        <th className="p-4 font-bold text-right">Đơn giá</th>
                        <th className="p-4 font-bold text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline">
                      {/* Room Row */}
                      <tr className="text-body-sm text-on-surface hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-body-md">{room.name}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5">{room.roomType.name}</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-medium">
                            {format(checkIn, "dd/MM", { locale: vi })} - {format(checkOut, "dd/MM/yyyy", { locale: vi })}
                          </span>
                          <div className="text-xs text-on-surface-variant">({booking.numberOfNights} đêm)</div>
                        </td>
                        <td className="p-4 text-center font-medium">1</td>
                        <td className="p-4 text-right font-medium">{formatVND(Number(booking.roomPricePerNight))}</td>
                        <td className="p-4 text-right font-bold">{formatVND(roomSubtotal)}</td>
                      </tr>

                      {/* Service Rows */}
                      {services.map((svc) => {
                        const lineTotal = Number(svc.priceSnapshot) * svc.quantity;
                        return (
                          <tr key={svc.service.name} className="text-body-sm text-on-surface hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-body-md">{svc.service.name}</div>
                              {svc.service.description && <div className="text-xs text-on-surface-variant mt-0.5">{svc.service.description}</div>}
                            </td>
                            <td className="p-4 text-center text-on-surface-variant">—</td>
                            <td className="p-4 text-center font-medium">x{svc.quantity}</td>
                            <td className="p-4 text-right font-medium">{formatVND(Number(svc.priceSnapshot))}</td>
                            <td className="p-4 text-right font-bold">{formatVND(lineTotal)}</td>
                          </tr>
                        );
                      })}

                      {/* Combo Rows */}
                      {combos.map((cmb) => {
                        const lineTotal = Number(cmb.comboPriceSnapshot) * cmb.quantity;
                        return (
                          <tr key={cmb.combo.name} className="text-body-sm text-on-surface hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-body-md">
                                <span className="material-symbols-outlined text-[14px] text-primary align-middle mr-1">diamond</span>
                                {cmb.combo.name}
                              </div>
                            </td>
                            <td className="p-4 text-center text-on-surface-variant">—</td>
                            <td className="p-4 text-center font-medium">x{cmb.quantity}</td>
                            <td className="p-4 text-right font-medium">{formatVND(Number(cmb.comboPriceSnapshot))}</td>
                            <td className="p-4 text-right font-bold">{formatVND(lineTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary/5 text-on-surface border-t border-outline">
                        <td className="p-4 text-right font-bold text-body-md" colSpan={4}>
                          Tổng tiền thanh toán (Đã gồm VAT)
                        </td>
                        <td className="p-4 text-right font-extrabold text-body-lg text-primary">
                          {formatVND(Number(booking.totalAmount))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Footer with Stamp */}
                <div className="flex justify-between items-start mt-12 pt-8 border-t border-outline">
                  <div className="max-w-[60%]">
                    <p className="font-headline-sm text-headline-sm italic text-primary font-bold mb-2">Cảm ơn quý khách!</p>
                    <p className="text-body-sm text-on-surface-variant leading-relaxed">
                      Cảm ơn quý khách đã lựa chọn dịch vụ của <strong>DTUVIVU Resort &amp; Spa</strong>. Sự hài lòng của quý khách là động lực phát triển của chúng tôi. Kính chúc quý khách có một kỳ nghỉ thật tuyệt vời tại thành phố biển xinh đẹp!
                    </p>
                  </div>
                  <div className="relative flex flex-col items-center text-center w-52 mr-4 select-none">
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-14 font-semibold uppercase tracking-wider">Người xác nhận</p>
                    <div className="absolute top-2 pointer-events-none select-none">
                      <svg width="135" height="135" viewBox="0 0 150 150" className="transform rotate-[-8deg] opacity-95">
                        <circle cx="75" cy="75" r="70" fill="none" stroke="#dc2626" strokeWidth="4" />
                        <circle cx="75" cy="75" r="54" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 2" />
                        <path id="stamp-top" d="M 21,75 A 54,54 0 1,1 129,75" fill="none" />
                        <path id="stamp-bottom" d="M 129,75 A 54,54 0 0,1 21,75" fill="none" />
                        <text fill="#dc2626" fontFamily="'Inter','Arial'" fontSize="9" fontWeight="900" letterSpacing="1">
                          <textPath href="#stamp-top" startOffset="50%" textAnchor="middle">
                            ★ DTUVIVU RESORT &amp; SPA ★
                          </textPath>
                        </text>
                        <text fill="#dc2626" fontFamily="'Inter','Arial'" fontSize="9.2" fontWeight="900" letterSpacing="1.2">
                          <textPath href="#stamp-bottom" startOffset="50%" textAnchor="middle">
                            {payment ? "ĐÃ THANH TOÁN" : "CHƯA TT"}
                          </textPath>
                        </text>
                        <text x="75" y="72" fill="#dc2626" fontFamily="'Poppins','Arial'" fontSize="16" fontWeight="900" textAnchor="middle" letterSpacing="1">DTUVIVU</text>
                        <line x1="40" y1="80" x2="110" y2="80" stroke="#dc2626" strokeWidth="1.5" />
                        <text x="75" y="93" fill="#dc2626" fontFamily="'Inter','Arial'" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                          {format(createdAt, "dd-MM-yyyy", { locale: vi })}
                        </text>
                      </svg>
                    </div>
                    <p className="font-body-md text-body-md font-bold mt-14 text-on-surface">Lễ tân Resort</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              {booking.status === "PENDING" && (
                <button onClick={handlePay} disabled={paying} className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-lg font-bold text-body-md transition-all active:scale-95 shadow-sm disabled:opacity-50">
                  <span className="material-symbols-outlined">payment</span>
                  {paying ? "Đang xử lý..." : "Thanh toán ngay"}
                </button>
              )}
              {(() => {
                const user = getUser();
                const isEmployeeOrAdmin = user?.role === "EMPLOYEE" || user?.role === "ADMIN";
                const canCancelGuest = booking.status === "PENDING" || (booking.status === "CONFIRMED" && (Date.now() - new Date(booking.createdAt).getTime()) / (1000 * 60 * 60) <= 24);
                const canCancelStaff = booking.status === "PENDING" || booking.status === "CONFIRMED";
                return (isEmployeeOrAdmin ? canCancelStaff : canCancelGuest);
              })() && (
                <button onClick={handleCancel} disabled={cancelling} className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-lg font-bold text-body-md transition-all active:scale-95 shadow-sm disabled:opacity-50">
                  <span className="material-symbols-outlined">cancel</span>
                  {cancelling ? "Đang xử lý..." : "Hủy đặt phòng"}
                </button>
              )}
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white px-8 py-3.5 rounded-lg font-bold text-body-md transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined">home</span>
                Về trang chủ
              </a>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 border border-outline bg-white hover:bg-slate-50 text-on-surface px-8 py-3.5 rounded-lg font-bold text-body-md transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined">print</span>
                In hóa đơn / Tải PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .success-checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 3;
          stroke-miterlimit: 10;
          stroke: #1594D8;
          fill: none;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .success-checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          stroke-width: 4;
          stroke: #1594D8;
          fill: none;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        @keyframes stroke {
          100% { stroke-dashoffset: 0; }
        }
        @media print {
          nav, header, footer { display: none !important; }
          body { background: white !important; color: #0f172a !important; }
          .max-w-max-width { margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
          .lg\\:col-span-3 { display: none !important; }
          .lg\\:col-span-9 { grid-column: span 12 !important; }
        }
      `}</style>
    </>
  );
}
