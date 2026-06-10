"use client";

import { formatVND } from "@/lib/utils";
import Link from "next/link";

interface ComboCardProps {
  combo: {
    id: number;
    name: string;
    description: string | null;
    comboPrice: number;
    imageUrls: string[];
    items: { serviceId: number; service: { id: number; name: string; price: number } }[];
  };
}

export function ComboCard({ combo }: ComboCardProps) {
  return (
    <div className="group bg-surface rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col border border-outline/50">
      <div className="relative h-48 overflow-hidden">
        {combo.imageUrls?.[0] ? (
          <img
            src={combo.imageUrls[0]}
            alt={combo.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">diamond</span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-primary/90 text-on-primary px-2.5 py-0.5 rounded-full text-label-caps text-xs font-semibold shadow-sm">
          Combo
        </span>
        {(() => {
          const original = combo.items.reduce((sum, i) => sum + Number(i.service.price), 0);
          const savings = original - Number(combo.comboPrice);
          return savings > 0 ? (
            <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-surface-bright px-2.5 py-0.5 rounded-md text-label-caps text-xs font-semibold shadow-sm">
              Tiết kiệm {formatVND(savings)}
            </span>
          ) : null;
        })()}
      </div>

      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors mb-2">
            {combo.name}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-3 line-clamp-2">
            {combo.description}
          </p>

          <div className="space-y-1.5 mb-4">
            {combo.items.map((item) => (
              <div key={item.serviceId} className="flex items-center gap-2 text-body-sm text-on-surface">
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                {item.service.name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-outline/50 mt-auto">
          <div>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">
              {formatVND(combo.comboPrice)}
            </span>
          </div>
          <Link
            href={`/service-combos/${combo.id}`}
            className="px-3 py-1.5 text-primary border border-primary rounded-lg text-label-caps text-xs font-semibold hover:bg-primary/5 transition-all"
          >
            Chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}
