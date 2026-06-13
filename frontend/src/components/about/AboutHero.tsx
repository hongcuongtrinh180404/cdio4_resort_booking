"use client";

import { Icon } from "@iconify/react";

export function AboutHero() {
  const scrollToGallery = () => {
    document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent mix-blend-overlay" />

      <div className="relative z-10 text-center px-margin-mobile md:px-margin-desktop max-w-4xl">
        <p className="font-label-caps text-label-caps text-primary-container/80 tracking-[0.15em] uppercase mb-6">
          DTUVIVU Resort &amp; Spa
        </p>
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-surface-bright leading-tight mb-6 drop-shadow-lg">
          More Than A Stay,<br />
          <span className="text-primary-container">A Complete Experience</span>
        </h1>
        <p className="font-body-lg text-body-lg text-surface-bright/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          Nơi mỗi khoảnh khắc đều được chăm chút để kỳ nghỉ của bạn trở nên trọn vẹn —
          từ phòng nghỉ sang trọng đến dịch vụ tận tâm.
        </p>
        <button
          onClick={scrollToGallery}
          className="bg-[#F5C26B] hover:bg-[#F5C26B]/90 text-on-surface px-10 py-4 rounded-full font-label-caps text-label-caps font-bold transition-all duration-300 shadow-xl hover:-translate-y-0.5 active:scale-95 inline-flex items-center gap-2"
        >
          Explore Resort
          <Icon icon="material-symbols:arrow-downward" className="text-lg" />
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <Icon icon="material-symbols:expand-more" className="text-surface-bright/60 text-2xl" />
      </div>
    </section>
  );
}
