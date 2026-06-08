# Frontend Implementation Plan — DTUVIVU

> Dựa trên design.md và thiết kế HTML trang chủ.

---

## Phase 1: Design System & Layout Foundation

### 1.1 `tailwind.config.ts`
- Thêm toàn bộ custom colors từ design.md (`primary`, `secondary`, `surface`, `on-surface`, `outline`, ...)
- Thêm fontFamily: Poppins (headlines) + Inter (body/labels)
- Thêm fontSize tương ứng (display-lg, headline-lg, headline-md, headline-sm, body-lg, body-md, body-sm, label-caps)
- Thêm spacing tokens: `max-width: 1280px`, `margin-desktop: 64px`, `margin-mobile: 20px`
- Thêm borderRadius: lg (0.5rem), xl (0.75rem), full (9999px)

### 1.2 `globals.css`
- Import Google Fonts: Inter (400,500,600) + Poppins (500,600,700) + Material Symbols Outlined
- `@layer components`: `.glass-card` (backdrop-filter blur, glassmorphism), `.hero-gradient`

### 1.3 `layout.tsx`
- Import Inter + Poppins từ `next/font/google` với CSS variables
- Thêm `<Navbar />` + `<Footer />` bao quanh `{children}`
- Main content có `pt-[88px]` (offset cho fixed header)
- Body class: `bg-background text-on-surface font-body-md antialiased`

### 1.4 `Navbar.tsx` (Redesign)
- Fixed top, glass effect (`bg-surface/80 backdrop-blur-md`), border-bottom
- Scroll effect: shadow-md khi scroll > 20px
- Logo "DTUVIVU" (font-headline-md, text-primary)
- Desktop nav links (Trang chủ, Phòng nghỉ, Dịch vụ, Về chúng tôi, Liên hệ)
  - Active state: `border-b-2 border-primary`
- Nút "Đặt phòng ngay" (bg-primary, rounded-full)
- User avatar (ảnh tròn, border-primary) + link đến profile
- Mobile hamburger menu (state toggle)
- Auth state: nếu đã login → hiển thị avatar + logout; chưa → hiển thị "Đăng nhập"

### 1.5 `Footer.tsx` (Redesign)
- 4-column grid (brand, sản phẩm, thông tin, liên hệ)
- Mỗi cột có heading `font-label-caps uppercase tracking-wider`
- Social links (language, mail icons) trong brand column
- Contact info: phone, email, address
- Copyright bar: bg-surface-container-low, flex row với "All rights reserved" + "Thiết kế tinh xảo từ DTUBooking"

---

## Phase 2: Homepage Components

### 2.1 `HeroSection.tsx`
- Grid 2 column (text left, image right)
- Badge: "Trải nghiệm nghỉ dưỡng cao cấp" (bg-primary-container, rounded-full)
- Heading: "Kỳ nghỉ trong mơ bắt đầu từ đây" với text-primary highlight
- Subtitle: description text
- 2 CTA buttons: "Đặt phòng ngay" (bg-primary) + "Xem resort" (outline)
- Hero image với gradient overlay + hover scale effect
- Includes `<SearchWidget />`

### 2.2 `SearchWidget.tsx`
- Glass card (`glass-card rounded-2xl p-6 md:p-8 shadow-2xl`)
- Position: absolute, -mt-16/-mt-24 để chồng lên hero
- Grid 4 cột: check-in date, check-out date, số khách (select), button search
- Material icons: calendar_today, group, search

### 2.3 `StatsSection.tsx`
- 4 stat cards grid (2 cột mobile, 4 cột desktop)
- IntersectionObserver + count-up animation
- Mỗi card: icon (material-symbols FILL=1) + number + label
- Hover: shadow-lg + -translate-y-1

### 2.4 `FeaturedRooms.tsx`
- Section heading + "Xem tất cả phòng" link
- Grid 3 cột room cards
- Mỗi card: image + badge + title + rating + description + price + "Xem chi tiết" button
- Includes `<RoomModal />` (state: modalRoom, setModalRoom)

### 2.5 `ServicesSection.tsx`
- Background: bg-surface-dim
- 4 service cards grid (1→2→4 cột responsive)
- Mỗi card: image + title + description + "Tìm hiểu thêm" link

### 2.6 `ReviewCarousel.tsx`
- Auto-slide mỗi 6s, pause on hover
- Star rating (filled stars), testimonial text (italic), user info
- Navigation buttons (chevron_left/right)
- IntersectionObserver pause/resume

### 2.7 `CTASection.tsx`
- bg-primary section với radial gradient overlay
- Heading + subtitle + "Đặt phòng ngay" button (bg-[#F5C26B], rounded-full)
- Hover effect: -translate-y-0.5

### 2.8 `RoomModal.tsx`
- Modal overlay với backdrop-blur
- 2-column: image (left) + details (right)
- Close button (X) + click outside to close + Escape key
- Room data: title, price, image, description, amenities (icon + text)
- "Đặt phòng ngay" (bg-primary) + favorite button (heart outline)
- Scale animation on mount/unmount
- Body scroll lock khi modal open

### 2.9 `app/page.tsx`
```tsx
<HeroSection />
<StatsSection />
<FeaturedRooms />
<ServicesSection />
<ReviewCarousel />
<CTASection />
```

---

## Phase 3: Apply Design System to Existing Pages

### 3.1 `RoomCard.tsx` (Redesign)
- Rounded-2xl, border, hover:shadow-xl
- Image với hover scale effect
- Room type badge (primary-container)
- Price với formatVND() từ lib/utils
- "Đặt ngay" link với arrow_forward icon

### 3.2 `rooms/page.tsx`
- Thêm filters (check-in, check-out, capacity, room type)
- Results grid with new RoomCard
- Loading skeleton

### 3.3 Auth pages (login, register, forgot-password)
- Card container với design system colors
- Form inputs styled

### 3.4 Profile pages
- Tabs: info, bookings, vouchers, wishlist
- Consistent styling

### 3.5 Admin pages
- Sidebar navigation
- Data tables with design system

---

## File Tree

```
frontend/src/
├── app/
│   ├── globals.css                     # MODIFIED
│   ├── layout.tsx                      # MODIFIED
│   └── page.tsx                        # MODIFIED
├── components/
│   ├── home/
│   │   ├── HeroSection.tsx             # NEW
│   │   ├── SearchWidget.tsx            # NEW
│   │   ├── StatsSection.tsx            # NEW
│   │   ├── FeaturedRooms.tsx           # NEW
│   │   ├── ServicesSection.tsx         # NEW
│   │   ├── ReviewCarousel.tsx          # NEW
│   │   ├── CTASection.tsx              # NEW
│   │   └── RoomModal.tsx               # NEW
│   ├── layout/
│   │   ├── Navbar.tsx                  # MODIFIED
│   │   └── Footer.tsx                  # MODIFIED
│   └── rooms/
│       └── RoomCard.tsx                # MODIFIED
├── lib/
│   ├── api.ts                          # UNCHANGED
│   ├── auth.ts                         # UNCHANGED
│   └── utils.ts                        # UNCHANGED
└── tailwind.config.ts                  # MODIFIED
```
