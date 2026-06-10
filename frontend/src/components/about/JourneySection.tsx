"use client";

import { useEffect, useRef, useState } from "react";

const JOURNEY_STEPS = [
  {
    step: "Book",
    image:
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80",
  },
  {
    step: "Arrival",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80",
  },
  {
    step: "Check In",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=400&q=80",
  },
  {
    step: "Stay",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80",
  },
  {
    step: "Dining",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80",
  },
  {
    step: "Activities",
    image:
      "https://i.pinimg.com/1200x/29/77/4e/29774eeb44d8186538337c0393cd54b7.jpg",
  },
  {
    step: "Check Out",
    image:
      "https://i.pinimg.com/1200x/ff/21/47/ff214720c0ead304cf41cc72914a4adc.jpg",
  },
];

function StepCard({
  item,
  index,
  visible,
}: {
  item: (typeof JOURNEY_STEPS)[number];
  index: number;
  visible: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 transition-all duration-700 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="group/step w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg ring-2 ring-white/50 shrink-0 transition-all duration-300 hover:border-primary hover:shadow-xl hover:scale-105">
        <img
          src={item.image}
          alt={item.step}
          className="w-full h-full object-cover transition-transform duration-500 group-hover/step:scale-110"
        />
      </div>
      <span className="font-label-caps text-label-caps text-on-surface font-semibold tracking-wider text-center whitespace-nowrap transition-colors duration-300 group-hover/step:text-primary">
        {item.step}
      </span>
    </div>
  );
}

export function JourneySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 md:py-32 bg-surface overflow-hidden" ref={ref}>
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-16">
          <p className="font-label-caps text-label-caps text-primary font-semibold tracking-[0.15em] uppercase mb-4">
            Experience
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-surface max-w-3xl mx-auto leading-tight">
            Journey Through DTUVIVU
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3 max-w-2xl mx-auto">
            Từ lúc đặt phòng đến khi chia tay, mỗi bước đều được thiết kế để mang đến
            trải nghiệm tuyệt vời nhất.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-4">
          {JOURNEY_STEPS.map((item, i) => (
            <div key={item.step} className="flex flex-col md:flex-row items-center gap-3">
              <StepCard item={item} index={i} visible={visible} />
              {i < JOURNEY_STEPS.length - 1 && (
                <span className="material-symbols-outlined text-primary/40 text-2xl rotate-90 md:rotate-0">
                  arrow_forward
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
