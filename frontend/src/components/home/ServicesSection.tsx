import Link from "next/link";

const services = [
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDqPlUTOeaTMum93Sis_yyElKva8u7F3-DGQNxygP0yZ2Wh6sCLEBPumWw-HHFDVqO4K4Z43ezjrYcZzpeoCzaaEY9DRhMqDL-ZdPg_bU2YbfmpDa94RILDahu0TeHHkARPzb08GWGIjC-10bYJ4VNLjGQf4HBPpolodcU6MtDadUqRqFmx1s-JJxJ-dRK3cE2KNy_g4OYUFFzI4CUJ5dcIzaUo46lE1lG5eQPNFC1ScffrEQTJwnCye5w_4-dyd5KITS0jDvUY8Hkq",
    title: "Zen Spa & Wellness",
    description: "Liệu pháp trị liệu, massage thảo mộc độc quyền giúp tái tạo tinh thần và thể chất.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    title: "Tour du lịch bản địa",
    description: "Khám phá các danh thắng nổi tiếng tại địa phương với hướng dẫn viên chuyên nghiệp.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    title: "Nhà hàng & Ẩm thực",
    description:
      "Bữa tiệc ẩm thực đẳng cấp kết hợp tinh hoa ẩm thực Á-Âu và hải sản tươi sống địa phương.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    title: "Đưa đón sân bay",
    description:
      "Hành trình an toàn, đẳng cấp và chu đáo từ lúc đặt chân xuống sân bay đến resort.",
  },
];

export function ServicesSection() {
  return (
    <section className="bg-surface-dim py-16 md:py-24 border-t border-outline/30" id="services">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4 tracking-tight">
            Trải nghiệm dịch vụ &amp; Tiện ích đi kèm
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Bên cạnh dịch vụ lưu trú cao cấp, DTUVIVU mang đến cho bạn các trải nghiệm chéo hấp dẫn
            giúp nâng tầm kỳ nghỉ dưỡng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-surface rounded-xl overflow-hidden border border-outline group hover:shadow-xl transition-all duration-300"
            >
              <div className="h-52 overflow-hidden relative">
                <img
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={service.image}
                />
              </div>
              <div className="p-6">
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">
                  {service.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 leading-relaxed">
                  {service.description}
                </p>
                <Link
                  href="#"
                  className="text-primary font-label-caps text-label-caps font-bold inline-flex items-center gap-1 hover:translate-x-1 transition-transform"
                >
                  Tìm hiểu thêm{" "}
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
