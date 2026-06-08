"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const reviews = [
  {
    stars: 5,
    text: "Kỳ nghỉ tuyệt vời nhất của gia đình tôi! View biển từ Ocean View Villa quá đẹp, nhân viên phục vụ cực kỳ chu đáo và đồ ăn tại nhà hàng hải sản rất tươi ngon. Nhất định sẽ quay lại!",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    name: "Nguyễn Thu Trang",
    location: "Đến từ Hà Nội",
  },
  {
    stars: 5,
    text: "Không gian Zen Spa rất yên bình và sang trọng. Liệu pháp massage đá nóng rất hiệu quả giúp tôi xua tan hoàn toàn mệt mỏi sau chuyến đi dài. Rất khuyến khích trải nghiệm combo này.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    name: "Trần Hoàng Nam",
    location: "Đến từ TP. Hồ Chí Minh",
  },
  {
    stars: 5,
    text: "Mọi thứ tại DTUVIVU đều hoàn hảo. Booking nhanh chóng, giao diện dễ thao tác. Tôi đặc biệt hài lòng với dịch vụ xe đưa đón sân bay tận nơi vô cùng tiện nghi.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    name: "Lê Minh Khoa",
    location: "Đến từ Đà Nẵng",
  },
];

export function ReviewCarousel() {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const startAutoSlide = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 6000);
  }, []);

  const stopAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [startAutoSlide, stopAutoSlide]);

  const next = () => {
    stopAutoSlide();
    setCurrent((prev) => (prev + 1) % reviews.length);
    startAutoSlide();
  };

  const prev = () => {
    stopAutoSlide();
    setCurrent((prev) => (prev - 1 + reviews.length) % reviews.length);
    startAutoSlide();
  };

  const review = reviews[current];

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop"
      id="reviews"
      onMouseEnter={stopAutoSlide}
      onMouseLeave={startAutoSlide}
    >
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4 tracking-tight">
          Khách hàng nói gì về DTUVIVU
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Hơn 5000+ khách hàng đã trải nghiệm và đánh giá chất lượng dịch vụ của chúng tôi.
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto">
        <div className="overflow-hidden rounded-2xl bg-surface border border-outline p-8 md:p-12 relative shadow-md">
          <div className="w-full flex-shrink-0 text-center space-y-6">
            <div className="flex justify-center text-secondary">
              {Array.from({ length: review.stars }).map((_, i) => (
                <span
                  key={i}
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              ))}
            </div>
            <p className="font-body-lg text-body-lg text-on-surface italic leading-relaxed">
              {review.text}
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <img
                alt={review.name}
                className="w-12 h-12 rounded-full object-cover"
                src={review.avatar}
              />
              <div className="text-left">
                <h4 className="font-headline-sm text-sm text-on-surface font-semibold">
                  {review.name}
                </h4>
                <p className="text-xs text-on-surface-variant">{review.location}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          className="absolute left-[-20px] md:left-[-60px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface border border-outline flex items-center justify-center shadow-lg hover:text-primary transition-colors hover:border-primary active:scale-95 z-10"
          onClick={prev}
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button
          className="absolute right-[-20px] md:right-[-60px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface border border-outline flex items-center justify-center shadow-lg hover:text-primary transition-colors hover:border-primary active:scale-95 z-10"
          onClick={next}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </section>
  );
}
