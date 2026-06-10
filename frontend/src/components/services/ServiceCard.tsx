"use client";

import { formatVND } from "@/lib/utils";
import Link from "next/link";

interface ServiceCardProps {
  service: {
    id: number;
    name: string;
    description: string | null;
    price: number;
    imageUrls: string[];
  };
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="group bg-surface rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col border border-outline/50">
      <div className="relative h-48 overflow-hidden">
        {service.imageUrls?.[0] ? (
          <img
            src={service.imageUrls[0]}
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">spa</span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors mb-2">
            {service.name}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 line-clamp-2">
            {service.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-outline/50 mt-auto">
          <div>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">
              {formatVND(service.price)}
            </span>
          </div>
          <Link
            href={`/services/${service.id}`}
            className="px-3 py-1.5 text-primary border border-primary rounded-lg text-label-caps text-xs font-semibold hover:bg-primary/5 transition-all"
          >
            Chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}
