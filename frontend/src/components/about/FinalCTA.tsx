"use client";

import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden group">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat scale-105 transition-transform duration-700 group-hover:scale-110"
        style={{
          backgroundImage:
            "url('https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780993248/gate_dztzuy.png')",
          backgroundPosition: "center 25%",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent mix-blend-overlay" />

      <div className="relative z-10 max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop text-center">
        <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-surface-bright leading-tight mb-4 drop-shadow-lg">
          Ready For Your Next Escape?
        </h2>
        <p className="font-body-lg text-body-lg text-surface-bright/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          Hãy để DTUVIVU đồng hành cùng bạn trong kỳ nghỉ đáng nhớ sắp tới.
        </p>
        <Link
          href="/rooms"
          className="inline-flex items-center gap-2 bg-[#F5C26B] hover:bg-[#F5C26B]/90 text-on-surface px-10 py-4 rounded-full font-label-caps text-label-caps font-bold transition-all duration-300 shadow-xl hover:-translate-y-0.5 active:scale-95"
        >
          Book Your Stay
          <span className="material-symbols-outlined text-lg">calendar_month</span>
        </Link>
      </div>
    </section>
  );
}
