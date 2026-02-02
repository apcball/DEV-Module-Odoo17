# 🌐 Monitor Website Backend API

Backend API สำหรับระบบ Monitor Website - ตรวจสอบสถานะเว็บไซต์และแจ้งเตือนผ่าน Telegram

Created by: **Atlas (The Squad)**

## 🚀 Features

- ✅ Monitor เว็บไซต์สูงสุด 10 เว็บ
- ⏰ เช็คสถานะอัตโนมัติทุก 1 ชั่วโมง (Cron Job)
- 📱 แจ้งเตือน Telegram เมื่อเว็บล่ม/กลับมาออนไลน์
- 📊 Dashboard สรุปสถานะทั้งหมด
- 📝 ประวัติการตรวจสอบ (Check Logs)
- 🚨 ระบบบันทึก Incidents (Downtime)
- 🔧 Manual check API

## 🛠️ Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Cron Job:** node-cron
- **HTTP Client:** axios
- **Notifications:** node-telegram-bot-api

## 📁 Project Structure

```
monitor-website/
├── src/
│   ├── controllers/      # API Controllers
│   ├── models/          # Database Models
│   ├── routes/          # Route Definitions
│   ├── services/        # Business Logic (Monitor, Cron)
│   ├── types/           # TypeScript Types
│   ├── utils/           # Utilities (DB, Telegram)
│   └── index.ts         # Entry Point
├── database/
│   └── schema.sql       # Database Schema
├── .env.example         # Environment Template
├── package.json
└── README.md
```

## 🚀 Installation

### 1. Clone และ Install Dependencies

```bash
cd monitor-website
npm install
```

### 2. Setup Database

```bash
# สร้าง database
createdb monitor_website

# รัน schema
npm run db:init
```

หรือรัน SQL เอง:
```bash
psql -U postgres -d monitor_website -f database/schema.sql
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# แก้ไขไฟล์ .env ตามการตั้งค่าของคุณ
```

**Required Environment Variables:**

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=monitor_website
DB_USER=postgres
DB_PASSWORD=your_password

# Telegram Bot (สำหรับแจ้งเตือน)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 4. วิธีสร้าง Telegram Bot

1. คุยกับ [@BotFather](https://t.me/BotFather) บน Telegram
2. ส่งคำสั่ง `/newbot`
3. ตั้งชื่อ bot และ username
4. นำ token ที่ได้มาใส่ใน `TELEGRAM_BOT_TOKEN`

**หา Chat ID:**
1. เพิ่ม bot เข้ากลุ่มหรือคุยกับ bot
2. เปิด URL: `https://api.telegram.org/bot[TOKEN]/getUpdates`
3. ดูค่า `chat.id` ใน response

### 5. Run Development Server

```bash
npm run dev
```

Server จะรันที่ `http://localhost:3001`

### 6. Build for Production

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Websites Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/websites` | รายการเว็บไซต์ทั้งหมด |
| GET | `/api/websites/:id` | ข้อมูลเว็บไซต์ตาม ID |
| POST | `/api/websites` | เพิ่มเว็บไซต์ใหม่ |
| PUT | `/api/websites/:id` | แก้ไขข้อมูลเว็บไซต์ |
| DELETE | `/api/websites/:id` | ลบเว็บไซต์ |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | ข้อมูลสรุป Dashboard |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/check/:id` | ตรวจสอบเว็บไซต์แบบ manual |

### Incidents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | รายการ incidents |
| GET | `/api/incidents/:id` | ข้อมูล incident |
| PUT | `/api/incidents/:id/acknowledge` | Acknowledge incident |

### Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | ประวัติการตรวจสอบ |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | API Info |

## 📝 API Examples

### Create Website

```bash
curl -X POST http://localhost:3001/api/websites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google",
    "url": "https://www.google.com",
    "description": "Search engine",
    "check_interval_minutes": 60,
    "expected_status_code": 200
  }'
```

### Get Dashboard

```bash
curl http://localhost:3001/api/dashboard
```

Response:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalWebsites": 10,
      "upCount": 9,
      "downCount": 1,
      "unknownCount": 0,
      "overallUptime": 99.5,
      "activeIncidents": 1,
      "incidents24h": 2,
      "avgResponseTime": 245
    },
    "websites": [...],
    "recentIncidents": [...],
    "recentLogs": [...]
  }
}
```

### Manual Check

```bash
curl -X POST http://localhost:3001/api/check/1
```

## 🗄️ Database Schema

### Tables

1. **websites** - ข้อมูลเว็บไซต์และสถานะล่าสุด
2. **check_logs** - ประวัติการตรวจสอบ
3. **incidents** - บันทึก downtime

### Views

- `website_status_overview` - สรุปสถานะเว็บไซต์
- `daily_uptime_stats` - สถิติ uptime รายวัน

## ⚙️ Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Monitor Check | ทุก 1 ชั่วโมง | ตรวจสอบสถานะเว็บไซต์ทั้งหมด |
| Daily Summary | 9:00 AM ทุกวัน | ส่งสรุปรายวันผ่าน Telegram |

## 🔔 Telegram Notifications

ระบบจะส่งแจ้งเตือนเมื่อ:
- 🚨 เว็บไซต์ down (status เปลี่ยนจาก up → down)
- ✅ เว็บไซต์กลับมาออนไลน์ (status เปลี่ยนจาก down → up)
- 📊 สรุปรายวัน (9:00 AM)

## 🧪 Testing

```bash
# Health check
curl http://localhost:3001/health

# Test Telegram notification
# (แก้ไขโค้ดเพื่อเรียก sendTestNotification หรือดูตัวอย่างใน utils/telegram.ts)
```

## 📝 License

MIT License

---

Made with ❤️ by The Squad