"use client";

export function SearchWidget() {
  return (
    <div className="relative z-20 -mt-16 md:-mt-24 max-w-4xl mx-auto glass-card rounded-2xl p-6 md:p-8 shadow-2xl">
      <form
        className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = "/rooms";
        }}
      >
        <div className="space-y-2">
          <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider font-semibold">
            Nhận phòng
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              calendar_today
            </span>
            <input
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface"
              type="date"
              defaultValue="2026-06-01"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider font-semibold">
            Trả phòng
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              calendar_today
            </span>
            <input
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface"
              type="date"
              defaultValue="2026-06-05"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider font-semibold">
            Số khách
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              group
            </span>
            <select className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface appearance-none">
              <option>2 Người lớn, 0 Trẻ em</option>
              <option>2 Người lớn, 1 Trẻ em</option>
              <option>4 Người lớn, 2 Trẻ em</option>
              <option>1 Người lớn</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/95 text-on-primary py-3 rounded-lg font-label-caps text-label-caps font-semibold transition-all duration-200 shadow hover:shadow-md h-[48px] flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">search</span>
          Tìm phòng
        </button>
      </form>
    </div>
  );
}
