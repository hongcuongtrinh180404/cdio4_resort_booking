"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { get } from "@/lib/api";
import { formatVND } from "@/lib/utils";

interface ServiceData {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrls: string[];
}

interface Props {
  serviceId: number | null;
  onClose: () => void;
}

export function ServiceDetailModal({ serviceId, onClose }: Props) {
  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);
    setSelectedImage(0);
    get<ServiceData>(`/services/${serviceId}`)
      .then(setService)
      .finally(() => setLoading(false));
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [serviceId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (serviceId) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [serviceId, onClose]);

  if (!serviceId) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in zoom-in-95 duration-200">
        {loading || !service ? (
          <div className="p-12 text-center animate-pulse space-y-4">
            <div className="h-8 bg-surface-container-high rounded w-1/3 mx-auto" />
            <div className="h-64 bg-surface-container-high rounded-xl" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-outline sticky top-0 bg-surface z-10">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                {service.name}
              </h2>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-full hover:bg-error-container/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              {(service.imageUrls?.length ?? 0) > 0 && (
                <div>
                  <div className="h-64 rounded-xl overflow-hidden border border-outline mb-3">
                    <img
                      src={service.imageUrls[selectedImage]}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {service.imageUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {service.imageUrls.map((url, i) => (
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
                {service.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-outline">
                <div>
                  <span className="text-2xl font-bold text-primary">{formatVND(service.price)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
