"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { get, downloadFile } from "@/lib/api";
import { formatVND, formatDate } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

interface DailyStat { date: string; bookingCount: number; revenue: number }
interface Summary { totalRevenue: number; totalBookings: number; revenueChange: number | null; bookingsChange: number | null }
interface RoomTypeStat { name: string; revenue: number; bookingCount: number }
interface BookedRoom { roomNumber: string; name: string; roomTypeName: string; bookingCount: number; revenue: number }
interface CustomerStat { fullName: string; email: string; phone: string | null; bookingCount: number; totalSpent: number }
interface SourceStat { source: string; revenue: number }
interface ServiceStat { name: string; totalUsage: number; revenue: number }

type SortKey = "date" | "bookingCount" | "revenue";
type SortDir = "asc" | "desc";

const SORT_LABELS: Record<SortKey, string> = { date: "Ngày", bookingCount: "Số booking", revenue: "Doanh thu" };
const DONUT_COLORS = ["#1594D8", "#F5C26B", "#10B981"];
const TOP_N_OPTIONS = [5, 10, 20];

// ────────────────────────────────────────────────────────────────
// Section Card wrapper
// ────────────────────────────────────────────────────────────────

function SectionCard({ title, icon, onExport, children }: {
  title: string; icon: string; onExport?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-outline overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon icon={icon} className="text-primary text-lg" />
          </div>
          <h2 className="font-headline-xs text-[15px] font-bold text-on-surface">{title}</h2>
        </div>
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-1.5 text-body-xs text-on-surface-variant hover:text-primary transition-colors">
            <Icon icon="material-symbols:file-save-outline" className="text-base" />
            Excel
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Trend Badge
// ────────────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[11px] text-on-surface-variant/50">— so với kỳ trước</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
      <Icon icon={up ? "material-symbols:trending-up" : "material-symbols:trending-down"} className="text-sm" />
      {up ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

// ────────────────────────────────────────────────────────────────
// Custom Tooltip for Pie Chart
// ────────────────────────────────────────────────────────────────

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white rounded-lg border border-outline shadow-lg px-3 py-2 text-body-xs">
      <p className="font-semibold text-on-surface">{d.name}</p>
      <p className="text-primary font-bold">{formatVND(d.value)}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  // Filters
  const [fromDate, setFromDate] = useState<Date>(subDays(new Date(), 30));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [topN, setTopN] = useState(10);

  // Data
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, totalBookings: 0, revenueChange: null, bookingsChange: null });
  const [roomTypes, setRoomTypes] = useState<RoomTypeStat[]>([]);
  const [bookedRooms, setBookedRooms] = useState<BookedRoom[]>([]);
  const [customers, setCustomers] = useState<CustomerStat[]>([]);
  const [revSources, setRevSources] = useState<SourceStat[]>([]);
  const [revSourceTotal, setRevSourceTotal] = useState(0);
  const [services, setServices] = useState<ServiceStat[]>([]);

  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Quick filter helpers
  const setQuickFilter = (from: Date, to: Date) => { setFromDate(from); setToDate(to); };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortedStats = useMemo(() => {
    const sorted = [...dailyStats];
    const mul = sortDir === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      if (sortKey === "date") return mul * a.date.localeCompare(b.date);
      return mul * (a[sortKey] - b[sortKey]);
    });
    return sorted;
  }, [dailyStats, sortKey, sortDir]);

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      fromDate: format(fromDate, "yyyy-MM-dd"),
      toDate: format(toDate, "yyyy-MM-dd"),
      topN: String(topN),
    });
    try {
      const [statsRes, roomTypesRes, roomsRes, custRes, srcRes, svcRes] = await Promise.all([
        get<{ data: DailyStat[]; summary: Summary }>(`/admin/reports/revenue-stats?${params}`),
        get<{ data: RoomTypeStat[] }>(`/admin/reports/top-room-types?${params}`),
        get<{ data: BookedRoom[] }>(`/admin/reports/top-booked-rooms?${params}`),
        get<{ data: CustomerStat[] }>(`/admin/reports/top-customers?${params}`),
        get<{ data: SourceStat[]; total: number }>(`/admin/reports/revenue-by-source?${params}`),
        get<{ data: ServiceStat[] }>(`/admin/reports/top-services?${params}`),
      ]);
      setDailyStats(statsRes.data);
      setSummary(statsRes.summary);
      setRoomTypes(roomTypesRes.data);
      setBookedRooms(roomsRes.data);
      setCustomers(custRes.data);
      setRevSources(srcRes.data);
      setRevSourceTotal(srcRes.total);
      setServices(svcRes.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [fromDate, toDate, topN]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Excel Exports ──
  const buildParams = () => new URLSearchParams({
    fromDate: format(fromDate, "yyyy-MM-dd"),
    toDate: format(toDate, "yyyy-MM-dd"),
    topN: String(topN),
  });

  const exportRevenue = () => downloadFile(`/admin/reports/revenue/export?${buildParams()}`, `bao_cao_doanh_thu.xlsx`);
  const exportRoomTypes = () => downloadFile(`/admin/reports/top-room-types/export?${buildParams()}`, `top_loai_phong.xlsx`);
  const exportBookedRooms = () => downloadFile(`/admin/reports/top-booked-rooms/export?${buildParams()}`, `top_phong_dat.xlsx`);
  const exportCustomers = () => downloadFile(`/admin/reports/top-customers/export?${buildParams()}`, `top_khach_hang.xlsx`);
  const exportRevenueSource = () => downloadFile(`/admin/reports/revenue-by-source/export?${buildParams()}`, `doanh_thu_theo_nguon.xlsx`);
  const exportServices = () => downloadFile(`/admin/reports/top-services/export?${buildParams()}`, `top_dich_vu.xlsx`);

  // ── Sort Icon ──
  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <Icon icon="material-symbols:unfold-more" className="text-sm text-on-surface-variant/40" />;
    return <Icon icon={sortDir === "asc" ? "material-symbols:arrow-upward" : "material-symbols:arrow-downward"} className="text-sm text-primary" />;
  };

  // ── Max values for progress bars ──
  const maxBookings = useMemo(() => Math.max(...bookedRooms.map(r => r.bookingCount), 1), [bookedRooms]);
  const maxServiceUsage = useMemo(() => Math.max(...services.map(s => s.totalUsage), 1), [services]);

  return (
    <div className="p-6 md:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Báo cáo & Thống kê</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Phân tích doanh thu và hoạt động kinh doanh của resort</p>
      </div>

      {/* ════════════════ Filter Bar ════════════════ */}
      <div className="bg-white rounded-xl border border-outline p-4 mb-6 space-y-3">
        {/* Row 1: Date pickers + actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[170px] justify-start text-left font-normal">
                <Icon icon="material-symbols:calendar-today" className="mr-2 h-4 w-4 shrink-0" />
                {fromDate ? format(fromDate, "dd/MM/yyyy") : "Từ ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={fromDate} onSelect={(d) => d && setFromDate(d)} disabled={(d) => d > toDate} />
            </PopoverContent>
          </Popover>

          <span className="text-body-sm text-on-surface-variant">—</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[170px] justify-start text-left font-normal">
                <Icon icon="material-symbols:calendar-today" className="mr-2 h-4 w-4 shrink-0" />
                {toDate ? format(toDate, "dd/MM/yyyy") : "Đến ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={toDate} onSelect={(d) => d && setToDate(d)} disabled={(d) => d < fromDate} />
            </PopoverContent>
          </Popover>

          {/* Top N selector */}
          <div className="flex items-center gap-2 border border-outline rounded-lg px-3 py-1.5">
            <span className="text-body-xs text-on-surface-variant whitespace-nowrap">Top</span>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="bg-transparent text-body-sm font-semibold text-on-surface outline-none cursor-pointer"
            >
              {TOP_N_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <Button onClick={fetchAll} className="gap-2">
            <Icon icon="material-symbols:filter-alt" className="text-lg" />
            Lọc
          </Button>
        </div>

        {/* Row 2: Quick filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-xs text-on-surface-variant mr-1">Nhanh:</span>
          {[
            { label: "7 ngày", from: subDays(new Date(), 7), to: new Date() },
            { label: "30 ngày", from: subDays(new Date(), 30), to: new Date() },
            { label: "Tháng này", from: startOfMonth(new Date()), to: new Date() },
            { label: "Năm nay", from: startOfYear(new Date()), to: new Date() },
          ].map((qf) => (
            <button
              key={qf.label}
              onClick={() => setQuickFilter(qf.from, qf.to)}
              className="px-3 py-1 rounded-full text-body-xs border border-outline text-on-surface-variant hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-body-md text-on-surface-variant">
          <Icon icon="material-symbols:progress-activity" className="text-3xl animate-spin mx-auto mb-3 text-primary" />
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className="space-y-6">
          {/* ════════════════ Summary Cards ════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-outline p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon icon="material-symbols:payments" className="text-primary text-2xl" />
                </div>
                <div className="flex-1">
                  <p className="text-body-sm text-on-surface-variant">Tổng doanh thu</p>
                  <p className="font-headline-md text-headline-md font-bold text-primary">{formatVND(summary.totalRevenue)}</p>
                </div>
                <TrendBadge value={summary.revenueChange} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-outline p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Icon icon="material-symbols:bookmark-check" className="text-blue-600 text-2xl" />
                </div>
                <div className="flex-1">
                  <p className="text-body-sm text-on-surface-variant">Tổng số booking</p>
                  <p className="font-headline-md text-headline-md font-bold text-blue-600">{summary.totalBookings}</p>
                </div>
                <TrendBadge value={summary.bookingsChange} />
              </div>
            </div>
          </div>

          {/* ════════════════ Revenue Trend Chart ════════════════ */}
          <SectionCard title="Biểu đồ doanh thu theo thời gian" icon="material-symbols:finance" onExport={exportRevenue}>
            {dailyStats.length === 0 ? (
              <p className="text-center text-body-sm text-on-surface-variant py-8">Không có dữ liệu</p>
            ) : (
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats} barCategoryGap="8%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd/MM")} tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} />
                    <YAxis tickFormatter={(v) => (v / 1_000_000).toFixed(0) + "M"} tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [formatVND(Number(value)), "Doanh thu"]}
                      labelFormatter={(label) => `Ngày ${format(new Date(label), "dd/MM/yyyy")}`}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    />
                    <Bar dataKey="revenue" fill="#1594D8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* ════════════════ Row: Top Room Types + Revenue by Source ════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Room Types */}
            <SectionCard title="Top loại phòng theo doanh thu" icon="material-symbols:hotel" onExport={exportRoomTypes}>
              {roomTypes.length === 0 ? (
                <p className="text-center text-body-sm text-on-surface-variant py-8">Không có dữ liệu</p>
              ) : (
                <div className="space-y-3">
                  {roomTypes.map((rt, idx) => {
                    const maxRev = Math.max(...roomTypes.map(r => r.revenue), 1);
                    const pct = (rt.revenue / maxRev) * 100;
                    return (
                      <div key={rt.name} className="flex items-center gap-3">
                        <span className="text-body-xs text-on-surface-variant w-5 text-right shrink-0">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-body-sm font-medium text-on-surface truncate">{rt.name}</span>
                            <span className="text-body-xs font-semibold text-primary ml-2 whitespace-nowrap">{formatVND(rt.revenue)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">{rt.bookingCount} booking</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Revenue by Source — Donut */}
            <SectionCard title="Doanh thu theo nguồn" icon="material-symbols:donut-small" onExport={exportRevenueSource}>
              {revSourceTotal === 0 ? (
                <p className="text-center text-body-sm text-on-surface-variant py-8">Không có dữ liệu</p>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="flex justify-center items-center w-full h-[220px]">
                    <PieChart width={220} height={200}>
                      <Pie
                        data={revSources}
                        dataKey="revenue"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {revSources.map((_, idx) => (
                          <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </div>
                  {/* Source breakdown */}
                  <div className="w-full mt-2 space-y-1.5">
                    {revSources.map((src, idx) => {
                      const pct = revSourceTotal > 0 ? (src.revenue / revSourceTotal * 100).toFixed(1) : "0";
                      return (
                        <div key={src.source} className="flex items-center justify-between text-body-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[idx] }} />
                            <span className="text-on-surface">{src.source}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-on-surface-variant">{pct}%</span>
                            <span className="font-semibold text-on-surface">{formatVND(src.revenue)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* ════════════════ Row: Top Booked Rooms + Most Used Services ════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Booked Rooms */}
            <SectionCard title="Top phòng được đặt nhiều nhất" icon="material-symbols:bed" onExport={exportBookedRooms}>
              {bookedRooms.length === 0 ? (
                <p className="text-center text-body-sm text-on-surface-variant py-8">Không có dữ liệu</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] text-on-surface-variant font-bold tracking-wider border-b border-outline">
                        <th className="pb-2 pr-2">#</th>
                        <th className="pb-2 pr-2">Phòng</th>
                        <th className="pb-2 pr-2">Loại</th>
                        <th className="pb-2 pr-2 text-center">Lượt đặt</th>
                        <th className="pb-2 text-right">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/50">
                      {bookedRooms.map((room, idx) => (
                        <tr key={room.roomNumber} className="text-body-xs hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 pr-2 text-on-surface-variant">{idx + 1}</td>
                          <td className="py-2.5 pr-2">
                            <div>
                              <span className="font-semibold text-on-surface">{room.roomNumber}</span>
                              <span className="text-on-surface-variant ml-1">· {room.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-2 text-on-surface-variant">{room.roomTypeName}</td>
                          <td className="py-2.5 pr-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(room.bookingCount / maxBookings) * 100}%` }} />
                              </div>
                              <span className="font-semibold text-on-surface w-6 text-center">{room.bookingCount}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-primary whitespace-nowrap">{formatVND(room.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {/* Most Used Services */}
            <SectionCard title="Dịch vụ được sử dụng nhiều nhất" icon="material-symbols:spa" onExport={exportServices}>
              {services.length === 0 ? (
                <p className="text-center text-body-sm text-on-surface-variant py-8">Không có dữ liệu</p>
              ) : (
                <div className="space-y-3">
                  {services.map((svc, idx) => {
                    const pct = (svc.totalUsage / maxServiceUsage) * 100;
                    return (
                      <div key={svc.name} className="flex items-center gap-3">
                        <span className="text-body-xs text-on-surface-variant w-5 text-right shrink-0">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-body-sm font-medium text-on-surface truncate">{svc.name}</span>
                            <span className="text-body-xs text-on-surface-variant ml-2 whitespace-nowrap">{svc.totalUsage} lượt · {formatVND(svc.revenue)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ════════════════ Top VIP Customers ════════════════ */}
          <SectionCard title="Top khách hàng VIP" icon="material-symbols:workspace-premium" onExport={exportCustomers}>
            {customers.length === 0 ? (
              <p className="text-center text-body-sm text-on-surface-variant py-8">Không có dữ liệu</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] text-on-surface-variant font-bold tracking-wider border-b border-outline">
                      <th className="pb-2 pr-3">#</th>
                      <th className="pb-2 pr-3">Khách hàng</th>
                      <th className="pb-2 pr-3">Email</th>
                      <th className="pb-2 pr-3">SĐT</th>
                      <th className="pb-2 pr-3 text-center">Booking</th>
                      <th className="pb-2 text-right">Tổng chi tiêu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/50">
                    {customers.map((cust, idx) => {
                      const initials = cust.fullName.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase();
                      const colors = ["bg-primary", "bg-amber-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500"];
                      return (
                        <tr key={cust.email} className="text-body-xs hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 pr-3 text-on-surface-variant font-medium">{idx + 1}</td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full ${colors[idx % colors.length]} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                                {initials}
                              </div>
                              <span className="font-semibold text-on-surface">{cust.fullName}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-3 text-on-surface-variant">{cust.email}</td>
                          <td className="py-3 pr-3 text-on-surface-variant">{cust.phone || "—"}</td>
                          <td className="py-3 pr-3 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold text-[11px]">
                              {cust.bookingCount}
                            </span>
                          </td>
                          <td className="py-3 text-right font-bold text-primary whitespace-nowrap">{formatVND(cust.totalSpent)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* ════════════════ Daily Revenue Table ════════════════ */}
          <SectionCard title="Bảng chi tiết doanh thu hàng ngày" icon="material-symbols:table-chart" onExport={exportRevenue}>
            {dailyStats.length === 0 ? (
              <p className="text-center text-body-sm text-on-surface-variant py-8">Không có dữ liệu</p>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline text-label-caps text-on-surface-variant font-bold text-[11px] tracking-wider">
                      {(["date", "bookingCount", "revenue"] as SortKey[]).map((key) => (
                        <th
                          key={key}
                          className={`p-3 font-bold cursor-pointer select-none hover:bg-black/5 transition-colors ${key === "date" ? "" : "text-right"}`}
                          onClick={() => handleSort(key)}
                        >
                          <div className={`flex items-center gap-1 ${key === "date" ? "" : "justify-end"}`}>
                            {SORT_LABELS[key]}
                            <SortIcon column={key} />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/50">
                    {sortedStats.map((stat) => (
                      <tr key={stat.date} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                        <td className="p-3 font-medium text-on-surface">{formatDate(stat.date)}</td>
                        <td className="p-3 text-right">{stat.bookingCount}</td>
                        <td className="p-3 text-right font-semibold text-primary">{formatVND(stat.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-outline text-body-sm font-bold bg-surface-container-low">
                      <td className="p-3 text-on-surface">Tổng</td>
                      <td className="p-3 text-right text-on-surface">{summary.totalBookings}</td>
                      <td className="p-3 text-right text-primary">{formatVND(summary.totalRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
