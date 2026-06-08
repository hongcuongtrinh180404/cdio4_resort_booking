"use client";

import { useEffect, useRef, useState } from "react";

interface StatCardProps {
  icon: string;
  iconColor: string;
  target: number;
  decimals?: number;
  suffix?: string;
  label: string;
}

function StatCard({ icon, iconColor, target, decimals = 0, suffix = "", label }: StatCardProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const stepTime = 30;
          const steps = duration / stepTime;
          const stepValue = target / steps;
          let current = 0;
          let iteration = 0;

          const timer = setInterval(() => {
            current += stepValue;
            iteration++;
            if (iteration >= steps) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(current);
            }
          }, stepTime);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  const displayValue =
    decimals > 0
      ? count.toFixed(decimals)
      : Math.floor(count) + (target > 10 && count >= target ? "+" : "");

  return (
    <div
      ref={ref}
      className="bg-surface p-6 rounded-xl border border-outline text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className={`${iconColor} mb-2`}>
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
        {displayValue}
      </h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 font-medium">{label}</p>
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="bg-surface-container-low py-16 md:py-20 border-y border-outline/50" id="stats-section">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <StatCard icon="groups" iconColor="text-primary" target={5000} label="Khách hàng hài lòng" />
          <StatCard icon="star" iconColor="text-secondary" target={4.9} decimals={1} label="Đánh giá trung bình" />
          <StatCard icon="bed" iconColor="text-primary" target={50} label="Phòng nghỉ cao cấp" />
          <StatCard icon="room_service" iconColor="text-primary" target={20} label="Dịch vụ tiện ích" />
        </div>
      </div>
    </section>
  );
}
