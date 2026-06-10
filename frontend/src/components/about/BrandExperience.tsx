"use client";

const BRAND_ITEMS = [
  {
    image:
      "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1781079725/key_yz5uqx.jpg",
    label: "Key Card",
    caption: "Seamless Access",
  },
  {
    image:
      "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1781079727/gift_mprnru.png",
    label: "Gift Box",
    caption: "Warm Welcome",
  },
  {
    image:
      "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1781079726/lock_swrpgz.jpg",
    label: "Lock",
    caption: "Absolute Privacy",
  },
  {
    image:
      "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1781079727/recception_hg92hf.png",
    label: "Reception",
    caption: "Personalized Service",
  },
  {
    image:
      "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1781079727/nhanvien_nalvw8.png",
    label: "Employee",
    caption: "Dedicated Care",
  },
  {
    image:
      "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1781079726/nhahang_qtzg11.jpg",
    label: "Restaurant",
    caption: "Culinary Excellence",
  },
];

export function BrandExperience() {
  return (
    <section className="py-24 md:py-32 bg-surface">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-16">
          <p className="font-label-caps text-label-caps text-primary font-semibold tracking-[0.15em] uppercase mb-4">
            Brand Experience
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-surface max-w-2xl mx-auto leading-tight">
            Chúng tôi hiện diện trong từng khoảnh khắc nghỉ dưỡng
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {BRAND_ITEMS.map((item) => (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer"
            >
              <img
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
                <p className="font-label-caps text-label-caps text-surface-bright/70 uppercase tracking-wider mb-1 transition-all duration-300 group-hover:translate-y-0 translate-y-2">
                  {item.label}
                </p>
                <div className="flex items-center gap-2 transition-all duration-300 group-hover:translate-y-0 translate-y-4 opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-[#F5C26B] text-lg">arrow_forward</span>
                  <span className="font-body-sm text-body-sm text-surface-bright font-semibold">
                    {item.caption}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
