"use client";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between pt-4 pb-1">
      <p className="text-body-xs text-on-surface-variant">
        Hiển thị {from}-{to} trên tổng số {total} kết quả
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-2 rounded-lg text-body-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-base">chevron_left</span>
        </button>
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="h-8 w-8 flex items-center justify-center text-body-xs text-on-surface-variant">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-8 w-8 rounded-lg text-body-xs font-semibold transition-all active:scale-95 ${
                p === page
                  ? "bg-primary text-white"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 px-2 rounded-lg text-body-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>
    </div>
  );
}