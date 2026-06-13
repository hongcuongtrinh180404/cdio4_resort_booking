import Link from "next/link";
import { Icon } from "@iconify/react";

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline" id="footer">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6 text-left">
          <img
            src="https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780902098/60340468-5c1e-4171-9fc0-98c767b00b26_q3vvbe.png"
            alt="DTUVIVU"
            className="h-10 w-auto"
          />
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Nền tảng đặt phòng resort cao cấp hàng đầu, mang đến các kỳ nghỉ thượng lưu hoàn hảo và
            độc bản.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-outline flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
            >
              <Icon icon="material-symbols:language" className="text-lg" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-outline flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
            >
              <Icon icon="material-symbols:mail" className="text-lg" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-label-caps text-label-caps font-bold text-on-surface uppercase tracking-wider mb-6">
            Sản phẩm
          </h4>
          <ul className="space-y-4 font-body-sm text-body-sm text-on-surface-variant">
            <li>
              <Link href="/rooms" className="hover:text-primary transition-colors">
                Phòng nghỉ cao cấp
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Combo nghỉ dưỡng
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Dịch vụ Spa & Trị liệu
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Nhà hàng đẳng cấp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-label-caps text-label-caps font-bold text-on-surface uppercase tracking-wider mb-6">
            Thông tin
          </h4>
          <ul className="space-y-4 font-body-sm text-body-sm text-on-surface-variant">
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Về chúng tôi
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Chính sách bảo mật
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Điều khoản dịch vụ
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Chính sách hoàn hủy
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="font-label-caps text-label-caps font-bold text-on-surface uppercase tracking-wider mb-6">
            Liên hệ
          </h4>
          <ul className="space-y-4 font-body-sm text-body-sm text-on-surface-variant">
            <li className="flex items-center gap-2">
              <Icon icon="material-symbols:phone" className="text-primary text-sm" /> 1900 1234
            </li>
            <li className="flex items-center gap-2">
              <Icon icon="material-symbols:mail" className="text-primary text-sm" />{" "}
              contact@dtuvivu.vn
            </li>
            <li className="flex items-center gap-2">
              <Icon icon="material-symbols:location-on" className="text-primary text-sm" /> Nha
              Trang, Khánh Hòa, Việt Nam
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-outline/50 py-8 text-center font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; 2026 DTUVIVU Resort &amp; Spa. All rights reserved.</p>
          <p>Thiết kế tinh xảo từ DTUBooking</p>
        </div>
      </div>
    </footer>
  );
}
