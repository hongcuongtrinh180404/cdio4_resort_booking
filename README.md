# DTUVIVI - Resort Booking Platform

Hệ thống đặt phòng resort với quản lý admin, AI Concierge và thanh toán trực tuyến.

## Yêu cầu

- **Node.js** >= 18
- **pnpm** (cài: `npm install -g pnpm`)
- **MySQL** 8+

## Cài đặt

```bash
# 1. Clone
git clone <url>
cd cdio4

# 2. Cài dependencies
pnpm install

# 3. Tạo database MySQL
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS dtuvivi;"
```

## Cấu hình môi trường

### Backend

Dự án này dùng Resend (resend.com) để gửi email. Khi clone project về, để chức năng quên mật khẩu (và gửi email xác nhận đặt phòng) hoạt động, cần làm như sau:
Cách lấy Resend API Key
1. Vào https://resend.com → đăng ký tài khoản (miễn phí)
2. Vào dashboard → API Keys → tạo key mới
3. Copy key dạng re_xxx...
Cấu hình
Thêm vào file backend/.env:

Copy `backend/.env.example` thành `backend/.env`:

```env
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/dtuvivi"
GROQ_API_KEY=gsk_...   # Lấy tại https://console.groq.com
RESEND_API_KEY=re_xxx... #Tạo resen api key bằng gmail muốn đăng ký tài khoản
```

Nếu để trống `JWT_SECRET`, code sẽ tự dùng `"secret"` — vẫn chạy được nhưng kém bảo mật.

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Database

```bash
cd backend
pnpm prisma generate
pnpm prisma db push     # Sync schema vào MySQL
pnpm prisma:seed        # Seed dữ liệu mẫu
```

## Chạy dự án

```bash
# Từ thư mục gốc — chạy cả backend + frontend cùng lúc
pnpm dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **Swagger Docs**: http://localhost:4000/api/docs

## Tài khoản demo (password: `123456`)

| Email | Vai trò |
|-------|---------|
| admin@dtuvivi.com | ADMIN |
| employee@dtuvivi.com | EMPLOYEE |
| guest@dtuvivi.com | GUEST |

## Công nghệ

- **Backend**: NestJS + Prisma + MySQL + Socket.io + JWT
- **Frontend**: Next.js 15 + Tailwind CSS
- **AI**: Groq (llama-3.3-70b-versatile) với WebSocket real-time
- **Thanh toán**: Mock payment (không dùng VNPay thật)
