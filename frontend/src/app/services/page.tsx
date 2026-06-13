"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ComboCard } from "@/components/services/ComboCard";
import { Icon } from "@iconify/react";

interface ServiceData {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrls: string[];
}

interface ComboItem {
  serviceId: number;
  service: { id: number; name: string; price: number };
}

interface ComboData {
  id: number;
  name: string;
  description: string | null;
  comboPrice: number;
  imageUrls: string[];
  items: ComboItem[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [combos, setCombos] = useState<ComboData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      get<ServiceData[]>("/services"),
      get<ComboData[]>("/service-combos"),
    ])
      .then(([svc, cmb]) => {
        setServices(svc);
        setCombos(cmb);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-surface-container-high rounded-2xl" />
          <div className="h-6 bg-surface-container-high rounded w-1/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-surface-container-high rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[320px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780993248/gate_dztzuy.png')",
          }}
        />
        <div className="absolute inset-0 hero-gradient backdrop-blur-[1px]" />
        <div className="relative z-10 w-full max-w-max-width px-margin-desktop text-center">
          <h1 className="font-headline-lg text-headline-lg text-surface-bright mb-4 drop-shadow-lg">
            Dịch vụ &amp; Tiện ích
          </h1>
          <p className="font-body-md text-body-md text-surface-bright/80 max-w-xl mx-auto">
            Tận hưởng kỳ nghỉ trọn vẹn với hệ thống dịch vụ và combo đa dạng tại DTUVIVU
          </p>
        </div>
      </section>

      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-16">
        {/* Individual Services */}
        <section>
          <div className="mb-8">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
              Dịch vụ lẻ
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Lựa chọn từ {services.length} dịch vụ cao cấp để nâng tầm kỳ nghỉ của bạn
            </p>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <Icon icon="material-symbols:spa" className="text-5xl mb-4" />
              <p className="text-body-lg font-medium">Chưa có dịch vụ nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </section>

        {/* Combos */}
        <section>
          <div className="mb-8">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
              Combo dịch vụ
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Tiết kiệm hơn với {combos.length} gói combo được thiết kế sẵn
            </p>
          </div>

          {combos.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <Icon icon="material-symbols:diamond" className="text-5xl mb-4" />
              <p className="text-body-lg font-medium">Chưa có combo nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combos.map((combo) => (
                <ComboCard key={combo.id} combo={combo} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
