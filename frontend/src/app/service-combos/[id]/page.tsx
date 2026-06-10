"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { get } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import Link from "next/link";

interface ServiceItem {
  serviceId: number;
  service: { id: number; name: string; price: number; imageUrls?: string[]; description?: string | null };
}

interface ComboData {
  id: number;
  name: string;
  description: string | null;
  comboPrice: number;
  imageUrls: string[];
  items: ServiceItem[];
}

function ComboDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [combo, setCombo] = useState<ComboData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    get<ComboData>(`/service-combos/${params.id}`)
      .then((res) => { setCombo(res); setSelectedImage(0); })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-surface-container-high rounded-2xl" />
          <div className="h-8 bg-surface-container-high rounded w-1/3" />
          <div className="h-4 bg-surface-container-high rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center">
        <p className="font-body-lg text-body-lg text-on-surface-variant">Không tìm thấy combo</p>
        <button onClick={() => router.back()} className="mt-4 inline-block text-primary font-label-caps text-label-caps font-bold">
          &larr; Quay lại
        </button>
      </div>
    );
  }

  const images = combo.imageUrls?.length > 0 ? combo.imageUrls : [];
  const originalTotal = combo.items.reduce((sum, i) => sum + Number(i.service.price), 0);
  const savings = originalTotal - Number(combo.comboPrice);

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-primary font-label-caps text-label-caps font-bold hover:text-primary/80 transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="h-[350px] md:h-[450px] rounded-2xl overflow-hidden border border-outline">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={combo.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl">diamond</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === i ? "border-primary shadow-md" : "border-outline hover:border-primary/50"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Combo details */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                {combo.name}
              </h1>
              <span className="bg-primary/90 text-on-primary px-3 py-0.5 rounded-full font-label-caps text-label-caps font-semibold text-xs">
                Combo
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                {formatVND(combo.comboPrice)}
              </span>
              {savings > 0 && (
                <span className="text-body-md text-on-surface-variant line-through">
                  {formatVND(originalTotal)}
                </span>
              )}
            </div>
          </div>

          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
            {combo.description}
          </p>

          {/* Included services */}
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">
              Dịch vụ bao gồm
            </h3>
            <div className="space-y-3">
              {combo.items.map((item) => (
                <div key={item.serviceId} className="flex items-center justify-between bg-surface-container-low px-4 py-3 rounded-lg border border-outline/50">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    <div>
                      <span className="text-body-md text-on-surface font-medium">{item.service.name}</span>
                      {item.service.description && (
                        <p className="text-body-sm text-on-surface-variant">{item.service.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-body-sm text-on-surface-variant font-medium">{formatVND(item.service.price)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Savings badge */}
          {savings > 0 && (
            <div className="bg-secondary-container/30 rounded-xl px-5 py-4 flex items-center gap-3 border border-secondary/20">
              <span className="material-symbols-outlined text-secondary text-2xl">sell</span>
              <div>
                <p className="text-body-sm text-on-surface font-semibold">
                  Tiết kiệm <strong className="text-secondary">{formatVND(savings)}</strong> so với mua lẻ
                </p>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Link
              href="/bookings/new"
              className="inline-block bg-primary hover:bg-primary/95 text-on-primary px-8 py-3.5 rounded-full font-label-caps text-label-caps font-semibold transition-all duration-200 shadow-md active:scale-95"
            >
              Thêm vào đặt phòng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComboDetailPage() {
  return (
    <Suspense fallback={null}>
      <ComboDetailContent />
    </Suspense>
  );
}
