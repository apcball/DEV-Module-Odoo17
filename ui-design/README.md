# IT Ticket Request Web App - UI/UX Design

## 📋 สารบัญ

1. [ภาพรวมโครงการ](#ภาพรวมโครงการ)
2. [สิ่งที่สร้าง](#สิ่งที่สร้าง)
3. [หน้าจอที่ออกแบบ](#หน้าจอที่ออกแบบ)
4. [Design System](#design-system)
5. [User Flows](#user-flows)
6. [การใช้งานสำหรับ Frontend Dev](#การใช้งานสำหรับ-frontend-dev)

---

## ภาพรวมโครงการ

โปรเจคออกแบบ UI/UX สำหรับ **IT Ticket Request Web Application** ระบบจัดการคำขอความช่วยเหลือทาง IT ที่ครอบคลุมการทำงานของทุก Role (User, IT Staff, Manager, Admin)

### ข้อมูลสำคัญจาก Backend
- **Ticket Format**: `IT-YYYYMMDD-XXX`
- **Status**: open, in_progress, waiting, resolved, closed, cancelled
- **Priority**: low, medium, high, critical
- **Roles**: user, it_staff, admin, manager

---

## สิ่งที่สร้าง

```
ui-design/
├── design-system/
│   └── design-system.md      # คู่มือ Design System ฉบับสมบูรณ์
├── wireframes/
│   └── wireframes.md         # Wireframes ทุกหน้าจอ
├── user-journey/
│   └── user-journey.md       # User Flows และ Journey Maps
├── assets/
│   └── styles.css            # CSS Variables และ Component Styles
└── README.md                 # ไฟล์นี้
```

---

## หน้าจอที่ออกแบบ

### 1. Authentication
| หน้า | รายละเอียด |
|------|-----------|
| **Login** | ฟอร์มเข้าสู่ระบบ พร้อมจดจำฉัน, ลืมรหัสผ่าน |
| **Register** | ฟอร์มสมัครสมาชิก เก็บชื่อ, อีเมล, แผนก, เบอร์ติดต่อ |

### 2. Dashboard (Role-based)
| Role | ฟีเจอร์หลัก |
|------|------------|
| **User** | สรุป Ticket ของตนเอง, Ticket ล่าสุด, ปุ่มสร้างใหม่ |
| **IT Staff** | งานที่ต้องทำ, Ticket เร่งด่วน, งานที่กำลังทำ |
| **Manager** | สถิติภาพรวม, กราฟ, SLA, ประสิทธิภาพ Staff |

### 3. Ticket Management
| หน้า | รายละเอียด |
|------|-----------|
| **Ticket List** | ตาราง/การ์ดแสดงรายการ, Filter, Search, Sort, Pagination |
| **Ticket Detail** | ข้อมูล Ticket, ความคิดเห็น, ประวัติ, ไฟล์แนบ |
| **Create Ticket** | ฟอร์มสร้าง Ticket ใหม่ พร้อม drag-drop ไฟล์ |

### 4. User Management
| หน้า | รายละเอียด |
|------|-----------|
| **User Profile** | ข้อมูลส่วนตัว, เปลี่ยนรหัสผ่าน, การตั้งค่าการแจ้งเตือน, สถิติ |

### 5. Responsive Design
- Desktop: Full layout
- Tablet: Adjusted grid
- Mobile: Stacked layout with bottom navigation

---

## Design System

### 🎨 Color Palette
```
Primary:    #2563EB (Blue)
Success:    #10B981 (Green)
Warning:    #F59E0B (Orange)
Danger:     #EF4444 (Red)
Info:       #3B82F6 (Blue)
Purple:     #8B5CF6 (High Priority)
```

### Status Colors
```
Open:       Green badge
In Progress: Blue badge
Waiting:    Orange badge
Resolved:   Green badge (dark)
Closed:     Gray badge
Cancelled:  Red badge
```

### Typography
- **Font**: Inter (sans-serif)
- **Monospace**: JetBrains Mono (for ticket numbers)
- **Hierarchy**: 32px → 24px → 20px → 18px → 16px → 14px → 12px

### Components
- Buttons (Primary, Secondary, Danger, Ghost)
- Form Inputs (Text, Select, Textarea)
- Cards (Standard, Ticket Card)
- Badges (Status, Priority)
- Tables
- Comments
- Timeline (History)
- Modals
- Toast Notifications

ดูรายละเอียดเพิ่มเติมใน [`design-system/design-system.md`](design-system/design-system.md)

---

## User Flows

### Flow หลัก

1. **User Create Ticket**
   ```
   Login → Dashboard → Create Ticket → Fill Form → 
   Submit → Success (Show Ticket #) → Ticket List
   ```

2. **IT Staff Process Ticket**
   ```
   Login → Dashboard → View New Tickets → 
   Accept → Update Status → Add Comments → Resolve
   ```

3. **Manager Monitor**
   ```
   Login → Dashboard → View Stats → Check SLA → 
   Review Staff Performance
   ```

ดูรายละเอียดเพิ่มเติมใน [`user-journey/user-journey.md`](user-journey/user-journey.md)

---

## การใช้งานสำหรับ Frontend Dev

### 1. CSS Variables
ไฟล์ `assets/styles.css` มี CSS Variables สำหรับใช้งานทั้งหมด:

```css
:root {
  --color-primary: #2563EB;
  --color-success: #10B981;
  --radius-md: 8px;
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  /* ... more variables */
}
```

### 2. Component Classes

#### Status Badge
```html
<span class="badge badge-open">Open</span>
<span class="badge badge-in-progress">In Progress</span>
<span class="badge badge-waiting">Waiting</span>
```

#### Ticket Card
```html
<div class="ticket-card status-open">
  <div class="priority priority-high">
    <span class="priority-dot"></span> High
  </div>
  <h3>#IT-20260202-015</h3>
  <p>Server down issue...</p>
</div>
```

#### Button
```html
<button class="btn btn-primary">สร้าง Ticket</button>
<button class="btn btn-secondary">ยกเลิก</button>
<button class="btn btn-danger">ลบ</button>
```

### 3. API Integration Points

ดูจาก Wireframes แต่ละหน้า จะมีการระบุ API Endpoints ที่ต้องใช้:

| หน้า | API Endpoint |
|------|-------------|
| Login | `POST /api/v1/auth/login` |
| Dashboard | `GET /api/v1/reports/dashboard` |
| Ticket List | `GET /api/v1/tickets` |
| Ticket Detail | `GET /api/v1/tickets/:id` |
| Create Ticket | `POST /api/v1/tickets` |
| Add Comment | `POST /api/v1/tickets/:id/comments` |

### 4. Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 480px) { ... }

/* Tablet */
@media (max-width: 768px) { ... }

/* Desktop */
/* Default styles */
```

---

## 🎯 Key Design Decisions

1. **Card-based Layout**: ใช้การ์ดแสดง Ticket เพื่อให้สแกนง่าย
2. **Color-coded Status**: สีแยกตามสถานะชัดเจน
3. **Left Border Accent**: เส้นขอบซ้ายของ Ticket Card บ่งบอกสถานะ
4. **Sticky Header**: Header ติดด้านบนเวลา scroll
5. **Real-time Updates**: Design รองรับการอัพเดตแบบ Real-time
6. **Empty States**: ออกแบบหน้าว่างให้เป็นมิตร พร้อม CTA

---

## 📱 Mobile-First Approach

- Bottom Navigation สำหรับ Mobile
- Stacked Layout แทน Grid
- Touch-friendly Targets (min 44px)
- Simplified Views สำหรับหน้าจอเล็ก

---

## 🚀 Next Steps สำหรับ Frontend Dev

1. ติดตั้ง Dependencies (React/Vue/Angular + Tailwind หรือ CSS Framework)
2. สร้าง Component Library ตาม Design System
3. Implement ตาม Wireframes ทีละหน้า
4. Test Responsive บนอุปกรณ์ต่างๆ
5. Integrate กับ Backend API

---

## 📝 Notes

- ออกแบบโดยคำนึงถึง Accessibility (WCAG 2.1)
- รองรับ Dark Mode (สามารถเพิ่ม variables สำหรับ dark theme ได้)
- Icons แนะนำ: Lucide React หรือ Heroicons
- Animation: ใช้ CSS transitions หรือ Framer Motion (React)

---

**สร้างโดย**: Canvas (UI/UX Designer)
**วันที่**: 2026-02-02
**ส่งต่อให้**: Pixel (Frontend Developer)
