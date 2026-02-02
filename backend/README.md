# IT Ticket Request System - Backend

ระบบจัดการคำขอ IT Support - Backend API สร้างด้วย Node.js + Express + PostgreSQL

## 🚀 เริ่มต้นใช้งาน

### ความต้องการเบื้องต้น
- Node.js 18+
- PostgreSQL 14+

### ติดตั้ง

```bash
# 1. Install dependencies
npm install

# 2. สร้างไฟล์ .env จากตัวอย่าง
cp .env.example .env

# 3. แก้ไขค่าใน .env ตามการตั้งค่าของคุณ
# โดยเฉพาะ DB_PASSWORD และ JWT_SECRET

# 4. สร้าง Database
createdb it_ticket_db

# 5. รัน migration (ถ้ามี)
npm run migrate

# 6. รัน seed data (ถ้ามี)
npm run seed
```

### รันเซิร์ฟเวอร์

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

เซิร์ฟเวอร์จะทำงานที่ `http://localhost:3000`

## 📚 API Documentation

ดูรายละเอียด API ได้ที่ [docs/API.md](docs/API.md)

### Endpoints หลัก

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | เข้าสู่ระบบ |
| `POST /api/v1/auth/register` | ลงทะเบียน |
| `GET /api/v1/tickets` | ดูรายการ Ticket |
| `POST /api/v1/tickets` | สร้าง Ticket ใหม่ |
| `GET /api/v1/tickets/:id` | ดูรายละเอียด Ticket |
| `POST /api/v1/tickets/:id/comments` | เพิ่มความคิดเห็น |
| `GET /api/v1/reports/dashboard` | ดูสถิติ Dashboard |

## 🗄️ Database Schema

ดูรายละเอียดโครงสร้างฐานข้อมูลได้ที่ [docs/database-schema.sql](docs/database-schema.sql)

### Tables หลัก
- `users` - ข้อมูลผู้ใช้งาน
- `tickets` - คำขอ IT Support
- `categories` - หมวดหมู่ปัญหา
- `ticket_comments` - ความคิดเห็น
- `ticket_history` - ประวัติการเปลี่ยนแปลง
- `sla_policies` - นโยบาย SLA

## 🔒 Authentication

ทุก API (ยกเว้น Login/Register) ต้องส่ง JWT Token:

```
Authorization: Bearer <token>
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | สภาพแวดล้อม | `development` |
| `PORT` | พอร์ตเซิร์ฟเวอร์ | `3000` |
| `DB_HOST` | ที่อยู่ฐานข้อมูล | `localhost` |
| `DB_NAME` | ชื่อฐานข้อมูล | `it_ticket_db` |
| `DB_USER` | ชื่อผู้ใช้ฐานข้อมูล | `postgres` |
| `DB_PASSWORD` | รหัสผ่านฐานข้อมูล | - |
| `JWT_SECRET` | Secret key สำหรับ JWT | - |

## 🧪 Testing

```bash
npm test
```

## 📂 โครงสร้างโปรเจกต์

```
backend/
├── src/
│   ├── config/         # การตั้งค่า (DB, etc.)
│   ├── controllers/    # ตัวควบคุม
│   ├── middleware/     # Middleware
│   ├── models/         # Database Models
│   ├── routes/         # API Routes
│   └── utils/          # Utility functions
├── docs/               # เอกสาร
├── tests/              # ไฟล์ทดสอบ
├── app.js              # Express app
└── server.js           # Entry point
```

## 👨‍💻 ทีมพัฒนา

- **Atlas** - Backend/API Design
- **Canvas** - UI/UX Design (ต่อไป)
- **Pixel** - Frontend Development (รอ)
- **Sherlock** - QA/Testing (รอ)

## 📄 License

MIT
