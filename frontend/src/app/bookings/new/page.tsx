"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { post, get } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { formatVND } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
}

interface RoomData {
  id: number;
  name: string;
  roomNumber: string;
  pricePerNight: number;
  capacity: number;
  roomType: { name: string };
  images: { imageUrl: string }[];
}

interface ServiceData {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrls?: string[];
}

interface ComboData {
  id: number;
  name: string;
  description: string | null;
  comboPrice: number;
  imageUrls?: string[];
  items: { serviceId: number; service: { name: string } }[];
}

interface OccupiedRange {
  from: string;
  to: string;
}

function NewBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = Number(searchParams.get("roomId")) || 0;

  const initialCheckIn = (() => {
    const v = searchParams.get("checkIn");
    if (!v) return undefined;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  })();
  const initialCheckOut = (() => {
    const v = searchParams.get("checkOut");
    if (!v) return undefined;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  })();
  const initialGuests = (() => {
    const v = searchParams.get("adults");
    return v ? Math.max(1, Number(v)) : 2;
  })();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [combos, setCombos] = useState<ComboData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [occupied, setOccupied] = useState<OccupiedRange[]>([]);

  const [checkIn, setCheckIn] = useState<Date | undefined>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [selectedServices, setSelectedServices] = useState<Record<number, number>>({});
  const [selectedCombos, setSelectedCombos] = useState<Record<number, number>>({});

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    Promise.all([
      get<RoomData>(`/rooms/${roomId}`),
      get<ServiceData[]>("/services"),
      get<ComboData[]>("/service-combos"),
    ]).then(([r, svc, cmb]) => {
      setRoom(r);
      setServices(svc);
      setCombos(cmb);
    }).catch(() => {});
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    get<{ occupied: OccupiedRange[] }>(`/rooms/${roomId}/availability`)
      .then((data) => setOccupied(data.occupied))
      .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    if (isAuthenticated()) {
      get<UserProfile>("/users/me").then(setProfile).catch(() => {});
    }
  }, []);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const isDateOccupied = useCallback((date: Date) => {
    return occupied.some((o) => {
      const from = new Date(o.from);
      const to = new Date(o.to);
      return date >= from && date < to;
    });
  }, [occupied]);

  const isDayDisabled = useCallback((date: Date) => {
    if (date < today) return true;
    if (isDateOccupied(date)) return true;
    return false;
  }, [today, isDateOccupied]);

  const numberOfNights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const roomTotal = useMemo(() => {
    if (!room) return 0;
    return numberOfNights * room.pricePerNight;
  }, [room, numberOfNights]);

  const serviceTotal = useMemo(() => {
    return Object.entries(selectedServices).reduce((sum, [id, qty]) => {
      const svc = services.find((s) => s.id === Number(id));
      return sum + (svc ? svc.price * qty : 0);
    }, 0);
  }, [selectedServices, services]);

  const comboTotal = useMemo(() => {
    return Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
      const cmb = combos.find((c) => c.id === Number(id));
      return sum + (cmb ? cmb.comboPrice * qty : 0);
    }, 0);
  }, [selectedCombos, combos]);

  const grandTotal = roomTotal + serviceTotal + comboTotal;

  const updateServiceQty = (id: number, delta: number) => {
    setSelectedServices((prev) => {
      const current = prev[id] ?? 0;
      const next = current + delta;
      if (next <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const toggleCombo = (id: number) => {
    setSelectedCombos((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated()) { router.push("/login"); return; }
    if (!checkIn || !checkOut) { setError("Vui lòng chọn ngày"); return; }
    setSubmitting(true);
    setError("");

    try {
      const servicesPayload = Object.entries(selectedServices).map(([id, qty]) => ({
        serviceId: Number(id), quantity: qty,
      }));
      const combosPayload = Object.entries(selectedCombos).map(([id, qty]) => ({
        comboId: Number(id), quantity: qty,
      }));

      const booking: any = await post("/bookings", {
        roomId,
        checkInDate: format(checkIn, "yyyy-MM-dd"),
        checkOutDate: format(checkOut, "yyyy-MM-dd"),
        services: servicesPayload.length ? servicesPayload : undefined,
        combos: combosPayload.length ? combosPayload : undefined,
      });

      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      setError(err.body?.message ?? "Đặt phòng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (!roomId) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center">
        <p className="text-body-lg text-on-surface-variant">Chưa chọn phòng</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-surface border-b border-outline/50">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-6">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Hoàn tất đặt phòng</h1>
          {room && (
            <p className="text-body-md text-on-surface-variant mt-1">{room.name} — {room.roomType.name}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT — 3/5 (60%) */}
          <div className="lg:col-span-3 space-y-8">
            {error && (
              <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-body-sm">{error}</div>
            )}

            {/* Customer Info */}
            <section className="bg-surface rounded-xl border border-outline/50 p-6 space-y-4">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Thông tin khách hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Họ tên</label>
                  <input type="text" defaultValue={profile?.fullName ?? ""} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Nhập họ tên" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Số điện thoại</label>
                  <input type="tel" defaultValue={profile?.phone ?? ""} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Nhập số điện thoại" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Email</label>
                  <input type="email" defaultValue={profile?.email ?? ""} className="w-full h-10 border border-outline rounded-lg px-3 text-body-sm bg-background text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Nhập email" />
                </div>
              </div>
            </section>

            {/* Stay Info */}
            <section className="bg-surface rounded-xl border border-outline/50 p-6 space-y-4">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Lịch trình & khách</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Ngày nhận phòng</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-10 border-outline gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        {checkIn ? format(checkIn, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={checkIn} onSelect={(d) => { setCheckIn(d); setCheckOut(undefined); }} disabled={isDayDisabled} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Ngày trả phòng</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-10 border-outline gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        {checkOut ? format(checkOut, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={checkOut} onSelect={(d) => d && setCheckOut(d)} disabled={(d) => d <= (checkIn ?? today) || isDayDisabled(d)} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {numberOfNights > 0 && <p className="text-body-sm text-primary font-semibold">{numberOfNights} đêm</p>}
              <div className="space-y-1.5">
                <label className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Số khách</label>
                <div className="flex items-center gap-3 border border-outline rounded-lg px-4 py-2 w-fit">
                  <span className="material-symbols-outlined text-primary text-lg">group</span>
                  <span className="text-body-sm text-on-surface">{guests} người</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1} className="flex h-7 w-7 items-center justify-center rounded-full border border-outline text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => setGuests(Math.min(room?.capacity ?? 10, guests + 1))} disabled={guests >= (room?.capacity ?? 10)} className="flex h-7 w-7 items-center justify-center rounded-full border border-outline text-primary hover:bg-primary/5 disabled:opacity-30 transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            </section>


          </div>

          {/* RIGHT — 2/5 (40%) */}
          <div className="lg:col-span-2">
            <div className="space-y-6 sticky top-24">
              {/* Room Summary */}
              {room && (
                <div className="bg-surface rounded-xl border border-outline/50 p-5 space-y-3">
                  {room.images?.[0] && (
                    <div className="h-40 rounded-xl overflow-hidden">
                      <img src={room.images[0].imageUrl} alt={room.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">{room.name}</h3>
                    <p className="text-body-sm text-on-surface-variant">{room.roomType.name} — Phòng {room.roomNumber}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
                    {checkIn && <span>{format(checkIn, "dd/MM/yyyy", { locale: vi })}</span>}
                    {(checkIn && checkOut) && <span>→</span>}
                    {checkOut && <span>{format(checkOut, "dd/MM/yyyy", { locale: vi })}</span>}
                    {numberOfNights > 0 && <span className="text-primary font-semibold">{numberOfNights} đêm</span>}
                    <span className="text-on-surface-variant">· {guests} khách</span>
                  </div>
                </div>
              )}

              {/* Service Cards */}
              <div className="bg-surface rounded-xl border border-outline/50 p-5 space-y-3">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Dịch vụ bổ sung</h3>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {services.map((svc) => {
                    const qty = selectedServices[svc.id] ?? 0;
                    return (
                      <div
                        key={svc.id}
                        className={`flex rounded-xl border overflow-hidden cursor-pointer transition-all ${
                          qty > 0 ? "border-primary bg-primary/5 shadow-sm" : "border-outline/50 hover:border-primary/50"
                        }`}
                        onClick={() => { if (!qty) updateServiceQty(svc.id, 1); }}
                      >
                        <div className="w-[40%] h-24 bg-surface-container-high flex-shrink-0">
                          {svc.imageUrls?.[0] ? (
                            <img src={svc.imageUrls[0]} alt={svc.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                              <span className="material-symbols-outlined">spa</span>
                            </div>
                          )}
                        </div>
                        <div className="w-[60%] p-3 flex flex-col justify-between">
                          <div>
                            <p className="text-body-sm font-semibold text-on-surface leading-tight">{svc.name}</p>
                            <p className="text-body-xs text-on-surface-variant mt-0.5 line-clamp-1">{svc.description}</p>
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-1">
                            <span className="text-body-sm font-bold text-primary">{formatVND(svc.price)}</span>
                            {qty > 0 ? (
                              <div className="flex items-center gap-1 bg-surface-container-high rounded-md px-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => updateServiceQty(svc.id, -1)} className="h-6 w-6 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded"><Minus className="h-3 w-3" /></button>
                                <span className="text-body-sm font-semibold w-5 text-center tabular-nums">{qty}</span>
                                <button type="button" onClick={() => updateServiceQty(svc.id, 1)} className="h-6 w-6 flex items-center justify-center text-primary rounded"><Plus className="h-3 w-3" /></button>
                              </div>
                            ) : (
                              <button type="button" onClick={(e) => { e.stopPropagation(); updateServiceQty(svc.id, 1); }} className="h-8 w-8 flex items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/5 transition-all">
                                <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Combo Cards */}
              <div className="bg-surface rounded-xl border border-outline/50 p-5 space-y-3">
                <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  Combo dịch vụ
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-label-caps text-xs font-semibold">Tiết kiệm</span>
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {combos.map((cmb) => {
                    const isSelected = !!selectedCombos[cmb.id];
                    const originalTotal = cmb.items.reduce((s, i) => s + Number(services.find((sv) => sv.id === i.serviceId)?.price ?? 0), 0);
                    const savings = Math.max(0, originalTotal - Number(cmb.comboPrice));

                    return (
                      <div
                        key={cmb.id}
                        className={`rounded-xl border overflow-hidden transition-all ${
                          isSelected ? "border-primary ring-1 ring-primary bg-primary/5 shadow-sm" : "border-outline/50 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex">
                          <div className="w-[40%] h-28 bg-surface-container-high flex-shrink-0 relative">
                            {cmb.imageUrls?.[0] ? (
                              <img src={cmb.imageUrls[0]} alt={cmb.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                <span className="material-symbols-outlined">diamond</span>
                              </div>
                            )}
                            {savings > 0 && (
                              <span className="absolute top-1 left-1 bg-error text-on-error px-1.5 py-0.5 rounded text-label-caps text-[10px] font-bold">-{formatVND(savings)}</span>
                            )}
                          </div>
                          <div className="w-[60%] p-3 flex flex-col justify-between">
                            <div className="flex-1">
                              <p className="text-body-sm font-semibold text-on-surface leading-tight">{cmb.name}</p>
                              <div className="mt-1 space-y-0.5">
                                {cmb.items.map((item) => (
                                  <div key={item.serviceId} className="flex items-center gap-1 text-body-xs text-on-surface-variant">
                                    <span className="material-symbols-outlined text-[10px] text-primary">check_circle</span>
                                    {item.service.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="mt-2 pt-1">
                              <div className="flex items-baseline gap-1">
                                <span className="text-body-sm font-bold text-primary">{formatVND(cmb.comboPrice)}</span>
                                {originalTotal > 0 && <span className="text-[10px] text-on-surface-variant line-through">{formatVND(originalTotal)}</span>}
                              </div>
                              <div className="flex justify-end mt-1">
                                {isSelected ? (
                                  <div className="flex items-center gap-1 bg-surface-container-high rounded-md px-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                                    <button type="button" onClick={() => { const id = cmb.id; setSelectedCombos((prev) => { const q = (prev[id] ?? 0) - 1; if (q <= 0) { const { [id]: _, ...rest } = prev; return rest; } return { ...prev, [id]: q }; }); }} className="h-6 w-6 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded"><Minus className="h-3 w-3" /></button>
                                    <span className="text-body-sm font-semibold w-5 text-center tabular-nums">{selectedCombos[cmb.id]}</span>
                                    <button type="button" onClick={() => setSelectedCombos((prev) => ({ ...prev, [cmb.id]: (prev[cmb.id] ?? 0) + 1 }))} className="h-6 w-6 flex items-center justify-center text-primary rounded"><Plus className="h-3 w-3" /></button>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => toggleCombo(cmb.id)} className="h-8 w-8 flex items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/5 transition-all">
                                    <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-surface rounded-xl border border-outline/50 p-5 space-y-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">Chi tiết giá</h3>
                <div className="flex justify-between text-body-sm text-on-surface-variant">
                  <span>Phòng ({(room?.pricePerNight ?? 0).toLocaleString()}₫ × {numberOfNights || 0} đêm)</span>
                  <span className="tabular-nums">{formatVND(roomTotal)}</span>
                </div>
                {serviceTotal > 0 && (
                  <div className="flex justify-between text-body-sm text-on-surface-variant">
                    <span>Dịch vụ</span>
                    <span className="tabular-nums">{formatVND(serviceTotal)}</span>
                  </div>
                )}
                {comboTotal > 0 && (
                  <div className="flex justify-between text-body-sm text-on-surface-variant">
                    <span>Combo</span>
                    <span className="tabular-nums">{formatVND(comboTotal)}</span>
                  </div>
                )}
                <hr className="border-outline/50" />
                <div className="flex justify-between font-headline-sm text-headline-sm text-primary font-bold">
                  <span>Tổng cộng</span>
                  <span className="tabular-nums">{formatVND(grandTotal)}</span>
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold text-sm hover:bg-primary/95 disabled:opacity-50 transition-all mt-3">
                  {submitting ? "Đang xử lý..." : "Đặt phòng"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="p-6">Đang tải...</div>}>
      <NewBookingForm />
    </Suspense>
  );
}
