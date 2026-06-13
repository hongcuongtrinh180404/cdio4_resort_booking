"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { get } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import Link from "next/link";
import { Icon } from "@iconify/react";

interface ServiceData {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrls: string[];
}

function ServiceDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    get<ServiceData>(`/services/${params.id}`)
      .then((res) => { setService(res); setSelectedImage(0); })
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

  if (!service) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center">
        <p className="font-body-lg text-body-lg text-on-surface-variant">Không tìm thấy dịch vụ</p>
        <button onClick={() => router.back()} className="mt-4 inline-block text-primary font-label-caps text-label-caps font-bold">
          &larr; Quay lại
        </button>
      </div>
    );
  }

  const images = service.imageUrls?.length > 0 ? service.imageUrls : [];

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-primary font-label-caps text-label-caps font-bold hover:text-primary/80 transition-colors mb-6"
      >
        <Icon icon="material-symbols:arrow-back" className="text-sm" />
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="h-[350px] md:h-[450px] rounded-2xl overflow-hidden border border-outline">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={service.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <Icon icon="material-symbols:spa" className="text-4xl" />
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

        {/* Service details */}
        <div className="space-y-8">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-2">
              {service.name}
            </h1>
            <p className="font-headline-sm text-headline-sm text-primary font-bold">
              {formatVND(service.price)}
            </p>
          </div>

          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
            {service.description}
          </p>

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

export default function ServiceDetailPage() {
  return (
    <Suspense fallback={null}>
      <ServiceDetailContent />
    </Suspense>
  );
}
