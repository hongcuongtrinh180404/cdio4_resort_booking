"use client";

import { Icon } from "@iconify/react";

export function HeroSection() {
  return (
    <section className="relative max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pt-12 md:pt-20 pb-32 md:pb-40">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 z-10 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container font-label-caps text-label-caps font-semibold shadow-sm">
            <Icon icon="material-symbols:stars" className="text-sm animate-pulse text-primary" />
            Trải nghiệm nghỉ dưỡng cao cấp
          </div>
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface leading-tight">
            Kỳ nghỉ trong mơ <br />
            <span className="text-primary">bắt đầu từ đây</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
            Trải nghiệm nghỉ dưỡng cao cấp với phòng sang trọng, dịch vụ trọn gói và khung cảnh thiên
            nhiên tuyệt đẹp tại DTUVIVU.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => (window.location.href = "/rooms")}
              className="bg-primary hover:bg-primary/95 text-on-primary px-8 py-3.5 rounded-full font-label-caps text-label-caps font-semibold transition-all duration-200 shadow-md active:scale-95"
            >
              Đặt phòng ngay
            </button>
            <a
              href="#rooms"
              className="border border-outline hover:border-primary text-primary px-8 py-3.5 rounded-full font-label-caps text-label-caps font-semibold transition-all duration-200 bg-surface shadow-sm hover:shadow active:scale-95 inline-flex items-center"
            >
              Xem resort
            </a>
          </div>
        </div>

        <div className="relative h-[400px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent z-10 pointer-events-none" />
          <img
            alt="Luxury resort exterior view"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            src="https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780900532/gate1_mi3bmv.png"
          />
        </div>
      </div>
    </section>
  );
}
