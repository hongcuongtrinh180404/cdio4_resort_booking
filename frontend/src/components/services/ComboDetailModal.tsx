"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { get } from "@/lib/api";
import { formatVND } from "@/lib/utils";

interface ServiceItem {
  serviceId: number;
  service: { id: number; name: string; price: number };
}

interface ComboData {
  id: number;
  name: string;
  description: string | null;
  comboPrice: number;
  imageUrls: string[];
  items: ServiceItem[];
}

interface Props {
  comboId: number | null;
  onClose: () => void;
}

export function ComboDetailModal({ comboId, onClose }: Props) {
  const [combo, setCombo] = useState<ComboData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!comboId) return;
    setLoading(true);
    setSelectedImage(0);
    get<ComboData>(`/service-combos/${comboId}`)
      .then(setCombo)
      .finally(() => setLoading(false));
  }, [comboId]);

  useEffect(() => {
    if (!comboId) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [comboId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (comboId) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [comboId, onClose]);

  if (!comboId) return null;

  const originalTotal = combo?.items.reduce((sum, i) => sum + i.service.price, 0) ?? 0;
  const savings = originalTotal - (combo?.comboPrice ?? 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in zoom-in-95 duration-200">
        {loading || !combo ? (
          <div className="p-12 text-center animate-pulse space-y-4">
            <div className="h-8 bg-surface-container-high rounded w-1/3 mx-auto" />
            <div className="h-64 bg-surface-container-high rounded-xl" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-outline sticky top-0 bg-surface z-10">
              <div className="flex items-center gap-3">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  {combo.name}
                </h2>
                <span className="bg-primary/90 text-on-primary px-2 py-0.5 rounded-md text-label-caps text-xs font-semibold">
                  Combo
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-full hover:bg-error-container/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              {(combo.imageUrls?.length ?? 0) > 0 && (
                <div>
                  <div className="h-64 rounded-xl overflow-hidden border border-outline mb-3">
                    <img
                      src={combo.imageUrls[selectedImage]}
                      alt={combo.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {combo.imageUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {combo.imageUrls.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImage(i)}
                          className={`w-16 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                            selectedImage === i
                              ? "border-primary shadow-md"
                              : "border-outline hover:border-primary/50"
                          }`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {combo.description}
              </p>

              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">
                  Dịch vụ bao gồm
                </h3>
                <div className="space-y-2">
                  {combo.items.map((item) => (
                    <div
                      key={item.serviceId}
                      className="flex items-center justify-between bg-surface-container-low px-4 py-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                        <span className="text-body-md text-on-surface">{item.service.name}</span>
                      </div>
                      <span className="text-body-sm text-on-surface-variant">{formatVND(item.service.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {savings > 0 && (
                <div className="bg-secondary-container/30 rounded-lg px-4 py-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm">sell</span>
                  <span className="text-body-sm text-on-surface">
                    Tiết kiệm <strong>{formatVND(savings)}</strong> so với mua lẻ
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-outline">
                <div>
                  <span className="text-xl text-on-surface-variant line-through">{formatVND(originalTotal)}</span>
                  <span className="text-2xl font-bold text-primary ml-3">{formatVND(combo.comboPrice)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
