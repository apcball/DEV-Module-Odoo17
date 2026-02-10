# Web Monitor Tool

**ระบบตรวจสอบสถานะเว็บไซต์ (Online/Offline) พร้อมแจ้งเตือนผ่าน Telegram**

## 🎯 Features

- 📊 **Dashboard** - แสดงรายการเว็บไซต์พร้อมสถานะ (🟢 Online / 🔴 Offline)
- ➕ **Add Website** - เพิ่มเว็บไซต์ที่ต้องการตรวจสอบ พร้อมตั้งค่า interval
- 🔔 **Telegram Alerts** - แจ้งเตือนเมื่อเว็บไซต์ Offline
- 📋 **Logs** - ประวัติการตรวจสอบ
- 🔄 **Auto Check** - ตรวจสอบอัตโนมัติทุก X นาที

## 🛠 Tech Stack

- **Backend:** Python + FastAPI + SQLite + APScheduler
- **Frontend:** HTML + CSS + JavaScript (Vanilla)
- **Notification:** Telegram Bot API

## 📁 Project Structure

```
web-monitor-deploy/
├── backend/
│   ├── main.py              # FastAPI app + scheduler + telegram
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
├── frontend/
│   └── index.html           # Dashboard UI
├── docs/
│   ├── ui-design.md         # UI Design mockups
│   └── qa-report.md         # QA Test results
└── README.md                # This file
```

## 🚀 Installation

### 1. Clone Repository
```bash
git clone https://github.com/apcball/DEV-Module-Odoo17.git
cd DEV-Module-Odoo17/web-monitor-deploy
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env and add your Telegram Bot Token
```

**Edit `.env`:**
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

### 3. Run Backend
```bash
python main.py
```
Backend will run at: `http://localhost:8000`

### 4. Open Frontend
Open `frontend/index.html` in your browser
Or serve with:
```bash
cd frontend
python -m http.server 3000
```
Then open: `http://localhost:3000`

## 📖 Usage

### 1. Get Telegram Bot Token
- คุยกับ [@BotFather](https://t.me/botfather) บน Telegram
- สร้าง Bot ใหม่
- ก็อปปี้ Token มาใส่ใน `.env`

### 2. Get Chat ID
- คุยกับ Bot ของคุณ
- ไปที่ `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
- หา `"chat":{"id":123456789` - ตัวเลขนั้นคือ Chat ID

### 3. Add Website
- เปิด Dashboard
- กด "+ Add Website"
- ใส่:
  - **Name:** ชื่อเว็บ (e.g., "Google")
  - **URL:** https://www.google.com
  - **Check Interval:** 5 (นาที)
  - **Telegram Chat ID:** @yourchannel หรือ 123456789
- กด Save

### 4. Monitor
- ระบบจะตรวจสอบเว็บอัตโนมัติทุก 5 นาที
- ถ้าเว็บ Offline จะได้รับแจ้งเตือนทาง Telegram

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/websites` | ดึงรายการเว็บทั้งหมด |
| POST | `/api/websites` | เพิ่มเว็บใหม่ |
| PUT | `/api/websites/{id}` | แก้ไขข้อมูลเว็บ |
| DELETE | `/api/websites/{id}` | ลบเว็บ |
| POST | `/api/check/{id}` | เช็คเว็บทันที |

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Token จาก BotFather | Yes |
| `DATABASE_URL` | SQLite database path | No (default: sqlite:///./monitor.db) |

## 👥 Team

- **Meow** 🎨 - UX/UI Design
- **Suga** ⚙️ - Backend Development (FastAPI, Telegram Bot)
- **Natjang** 💻 - Frontend Development (HTML/CSS/JS)
- **Krapuk** 🧪 - QA Testing
- **Manow** 🔗 - Integration & Deployment

## 📄 License

MIT License - Created by Buz Team
