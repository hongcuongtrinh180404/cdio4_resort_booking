"use client";

const GALLERY_ITEMS = [
  {
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
    label: "Villa",
    size: "large" as const,
  },
  {
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    label: "Beach",
    size: "small" as const,
  },
  {
    image:
      "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1781080266/a4918ced-34a8-4b88-9830-575c306a7631_acys2n.jpg",
    label: "Pool",
    size: "small" as const,
  },
  {
    image:
      "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1781080267/ebe1db8ac994bda20520672a1a7d73a9_qoqeq2.jpg",
    label: "Spa",
    size: "large" as const,
  },
  {
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80",
    label: "Restaurant",
    size: "small" as const,
  },
  {
    image:
      "https://i.pinimg.com/736x/c9/c6/12/c9c612fe195293fb3339c5c781eae860.jpg",
    label: "Sunset",
    size: "small" as const,
  },
];

export function GallerySection() {
  return (
    <section id="gallery" className="py-24 md:py-32 bg-background scroll-mt-24">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-16">
          <p className="font-label-caps text-label-caps text-primary font-semibold tracking-[0.15em] uppercase mb-4">
            Resort Gallery
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-surface max-w-2xl mx-auto leading-tight">
            Bộ ảnh khu nghỉ dưỡng
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3 max-w-xl mx-auto">
            Cho ảnh kể chuyện — mỗi góc nhìn là một trải nghiệm.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {GALLERY_ITEMS.map((item) => (
            <div
              key={item.label}
              className={`group relative overflow-hidden rounded-xl cursor-pointer ${
                item.size === "large" ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
              }`}
            >
              <img
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <span className="font-label-caps text-label-caps text-surface-bright font-semibold tracking-wider uppercase">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
