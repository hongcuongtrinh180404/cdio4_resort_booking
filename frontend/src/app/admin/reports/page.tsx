"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { get, downloadFile } from "@/lib/api";
import { formatVND, formatDate } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { format, subDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DailyStat {
  date: string;
  bookingCount: number;
  revenue: number;
}

interface Summary {
  totalRevenue: number;
  totalBookings: number;
}

type SortKey = "date" | "bookingCount" | "revenue";
type SortDir = "asc" | "desc";

const SORT_LABELS: Record<SortKey, string> = {
  date: "Ngày",
  bookingCount: "Số booking",
  revenue: "Doanh thu",
};

export default function AdminReportsPage() {
  const [fromDate, setFromDate] = useState<Date>(subDays(new Date(), 30));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, totalBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
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

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fromDate: format(fromDate, "yyyy-MM-dd"),
        toDate: format(toDate, "yyyy-MM-dd"),
      });
      const res = await get<{ data: DailyStat[]; summary: Summary }>(
        `/admin/reports/revenue-stats?${params}`
      );
      setDailyStats(res.data);
      setSummary(res.summary);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleExportExcel = async () => {
    try {
      const fromStr = format(fromDate, "yyyy-MM-dd");
      const toStr = format(toDate, "yyyy-MM-dd");
      const params = new URLSearchParams({
        fromDate: fromStr,
        toDate: toStr,
      });
      const filename = `bao_cao_doanh_thu_${fromStr}_to_${toStr}.xlsx`;
      await downloadFile(`/admin/reports/revenue/export?${params}`, filename);
    } catch (error) {
      console.error("Failed to export Excel", error);
      alert("Xuất Excel thất bại. Vui lòng thử lại sau.");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <Icon icon="material-symbols:unfold-more" className="text-sm text-on-surface-variant/40" />;
    return (
      <Icon
        icon={sortDir === "asc" ? "material-symbols:arrow-upward" : "material-symbols:arrow-downward"}
        className="text-sm text-primary"
      />
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Báo cáo doanh thu</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Thống kê doanh thu theo thời gian</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-outline p-4 mb-6 flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
              <Icon icon="material-symbols:calendar-today" className="mr-2 h-4 w-4 shrink-0" />
              {fromDate ? format(fromDate, "dd/MM/yyyy") : "Từ ngày"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={fromDate} onSelect={(d) => d && setFromDate(d)} />
          </PopoverContent>
        </Popover>

        <span className="text-body-sm text-on-surface-variant">—</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
              <Icon icon="material-symbols:calendar-today" className="mr-2 h-4 w-4 shrink-0" />
              {toDate ? format(toDate, "dd/MM/yyyy") : "Đến ngày"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={toDate} onSelect={(d) => d && setToDate(d)} />
          </PopoverContent>
        </Popover>

        <Button onClick={fetchStats} className="gap-2">
          <Icon icon="material-symbols:filter-alt" className="text-lg" />
          Lọc
        </Button>

        <div className="flex-1" />

        <Button variant="outline" onClick={handleExportExcel} className="gap-2">
          <Icon icon="material-symbols:file-save" className="text-lg" />
          Xuất Excel
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Đang tải...</div>
      ) : dailyStats.length === 0 ? (
        <div className="text-center py-12 text-body-md text-on-surface-variant">Không có dữ liệu trong khoảng thời gian này</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-outline p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon icon="material-symbols:payments" className="text-primary text-2xl" />
                </div>
                <div>
                  <p className="text-body-sm text-on-surface-variant">Tổng doanh thu</p>
                  <p className="font-headline-md text-headline-md font-bold text-primary">{formatVND(summary.totalRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-outline p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Icon icon="material-symbols:bookmark-check" className="text-blue-600 text-2xl" />
                </div>
                <div>
                  <p className="text-body-sm text-on-surface-variant">Tổng số booking</p>
                  <p className="font-headline-md text-headline-md font-bold text-blue-600">{summary.totalBookings}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-outline p-6 mb-6">
            <h2 className="font-headline-xs text-headline-xs font-bold text-on-surface mb-4">Biểu đồ doanh thu theo thời gian</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dailyStats} barCategoryGap="8%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(new Date(v), "dd/MM")}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => (v / 1_000_000).toFixed(0) + "M"}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatVND(Number(value)), "Doanh thu"]}
                  labelFormatter={(label) => `Ngày ${format(new Date(label), "dd/MM/yyyy")}`}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-outline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline text-label-caps text-on-surface-variant font-bold text-[11px] tracking-wider">
                    {(["date", "bookingCount", "revenue"] as SortKey[]).map((key) => (
                      <th
                        key={key}
                        className={`p-4 font-bold cursor-pointer select-none hover:bg-black/5 transition-colors ${key === "date" ? "" : "text-right"}`}
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
                <tbody className="divide-y divide-outline">
                  {sortedStats.map((stat) => (
                    <tr key={stat.date} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                      <td className="p-4 font-medium text-on-surface">{formatDate(stat.date)}</td>
                      <td className="p-4 text-right">{stat.bookingCount}</td>
                      <td className="p-4 text-right font-semibold text-primary">{formatVND(stat.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-container-low border-t-2 border-outline text-body-sm font-bold">
                    <td className="p-4 text-on-surface">Tổng</td>
                    <td className="p-4 text-right text-on-surface">{summary.totalBookings}</td>
                    <td className="p-4 text-right text-primary">{formatVND(summary.totalRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
