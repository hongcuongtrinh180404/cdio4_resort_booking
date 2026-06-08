"use client";

export function CTASection() {
  return (
    <section className="bg-primary text-on-primary py-24 relative overflow-hidden" id="offers">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10 text-center space-y-6">
        <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg leading-tight">
          Sẵn sàng cho kỳ nghỉ đáng nhớ?
        </h2>
        <p className="font-body-lg text-body-lg text-primary-container max-w-2xl mx-auto leading-relaxed">
          Đăng ký thành viên DTUVIVU ngay hôm nay để nhận thêm ưu đãi đặc quyền 20% khi chọn các
          combo dịch vụ cao cấp.
        </p>
        <div className="pt-4">
          <button
            onClick={() => (window.location.href = "/rooms")}
            className="bg-[#F5C26B] hover:bg-[#F5C26B]/90 text-on-surface px-10 py-4 rounded-full font-label-caps text-label-caps font-bold text-lg transition-all duration-200 shadow-xl hover:-translate-y-0.5 active:scale-95"
          >
            Đặt phòng ngay
          </button>
        </div>
      </div>
    </section>
  );
}
