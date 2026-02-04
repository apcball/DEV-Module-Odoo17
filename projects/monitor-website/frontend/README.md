# Monitor Website - Frontend Dashboard

Frontend Dashboard สำหรับระบบ Monitor Website สร้างด้วย Next.js 14 + React + TypeScript + Tailwind CSS + Recharts

## Features

### Dashboard Page (`/`)
- Overview Cards: แสดงจำนวน Online/Warning/Offline, Avg Response Time, Avg Uptime
- Website Table: รายการเว็บไซต์ทั้งหมดพร้อม Status Badge (🟢🟡🔴)
- Uptime Chart: กราฟ Uptime 24 ชั่วโมง
- Response Time Chart: กราฟ Response Time
- Recent Incidents: ตารางแสดง Incidents ล่าสุด

### Website Management Page (`/websites`)
- Table แสดง 10 เว็บไซต์
- ปุ่ม Add Website (Modal Form)
- ปุ่ม Edit/Delete แต่ละแถว
- Toggle: Active/Inactive, Notifications

### History/Incidents Page (`/history`)
- Filters: Website, Status, Date Range
- Charts: Incident Distribution (Pie), Downtime Trend (Bar)
- Table: ประวัติ Incidents
- Uptime Stats: 24h/7d/30d per website

## Tech Stack

- **Next.js 14** - React Framework
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling (Dark Theme #0F172A)
- **Recharts** - Charts
- **Axios** - HTTP Client
- **Lucide React** - Icons

## Design System

### Colors
- Background: `#0F172A` (slate-900)
- Card: `#1E293B` (slate-800)
- Border: `#334155`
- Text Primary: `#F8FAFC`
- Text Muted: `#64748B`
- Online: `#10B981` (green-500)
- Warning: `#F59E0B` (yellow-500)
- Offline: `#EF4444` (red-500)

## Project Structure

```
monitor-website/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Dashboard Page
│   ├── websites/
│   │   └── page.tsx       # Website Management Page
│   ├── history/
│   │   └── page.tsx       # History/Incidents Page
│   ├── layout.tsx         # Root Layout
│   └── globals.css        # Global Styles
├── components/            # React Components
│   ├── StatusBadge.tsx    # Status Badge Component
│   ├── StatCard.tsx       # Statistics Card
│   ├── WebsiteTable.tsx   # Website Table
│   ├── IncidentTable.tsx  # Incident Table
│   ├── Modal.tsx          # Modal Components
│   ├── Filters.tsx        # Filter Components
│   ├── UptimeChart.tsx    # Uptime Line Chart
│   ├── ResponseTimeChart.tsx  # Response Time Area Chart
│   ├── IncidentCharts.tsx # Incident Charts
│   └── SidebarLayout.tsx  # Sidebar Layout
├── lib/                   # Utilities
│   ├── api.ts            # API Client
│   └── utils.ts          # Utility Functions
├── types/                 # TypeScript Types
│   └── index.ts          # Type Definitions
├── public/               # Static Assets
├── package.json
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

## API Endpoints

Base URL: `http://localhost:3001/api`

### Dashboard
- `GET /dashboard/stats` - Dashboard statistics
- `GET /dashboard/uptime?hours=24` - Uptime chart data
- `GET /dashboard/response-time?hours=24` - Response time data
- `GET /dashboard/incidents?limit=10` - Recent incidents

### Websites
- `GET /websites` - List all websites
- `POST /websites` - Create new website
- `PUT /websites/:id` - Update website
- `DELETE /websites/:id` - Delete website
- `GET /websites/:id/uptime` - Uptime stats for website

### Incidents
- `GET /incidents` - List incidents with filters
- `GET /incidents/stats` - Incident statistics

## Getting Started

### 1. Install Dependencies

```bash
cd monitor-website
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

เปิด browser ที่ `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
npm start
```

## Environment Variables

สร้างไฟล์ `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Mock Data

หาก API ยังไม่พร้อม ระบบจะใช้ Mock Data อัตโนมัติ

## Navigation

- **Dashboard** (`/`) - ภาพรวมระบบ
- **Websites** (`/websites`) - จัดการเว็บไซต์
- **History** (`/history`) - ประวัติ Incidents

---

สร้างโดย **Pixel** (Frontend Developer) - The Squad
