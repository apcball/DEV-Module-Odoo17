# IT Ticket API Documentation

## Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.yourdomain.com/api/v1
```

## Authentication
ทุก API (ยกเว้น Login/Register) ต้องส่ง JWT Token ใน Header:
```
Authorization: Bearer <token>
```

---

## Endpoints Summary

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | เข้าสู่ระบบ |
| POST | `/auth/register` | ลงทะเบียน |
| POST | `/auth/logout` | ออกจากระบบ |
| GET | `/auth/me` | ข้อมูลผู้ใช้ปัจจุบัน |
| POST | `/auth/refresh` | Refresh Token |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets` | ดูรายการ Ticket ทั้งหมด |
| POST | `/tickets` | สร้าง Ticket ใหม่ |
| GET | `/tickets/:id` | ดูรายละเอียด Ticket |
| PUT | `/tickets/:id` | อัพเดท Ticket |
| DELETE | `/tickets/:id` | ลบ Ticket |
| POST | `/tickets/:id/assign` | มอบหมายงาน |
| POST | `/tickets/:id/status` | เปลี่ยนสถานะ |
| POST | `/tickets/:id/comments` | เพิ่มความคิดเห็น |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | ดูรายการผู้ใช้ |
| GET | `/users/:id` | ดูข้อมูลผู้ใช้ |
| PUT | `/users/:id` | อัพเดทข้อมูล |
| GET | `/users/:id/tickets` | ดู Ticket ของผู้ใช้ |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | ดูหมวดหมู่ทั้งหมด |
| POST | `/categories` | สร้างหมวดหมู่ (Admin) |
| PUT | `/categories/:id` | อัพเดทหมวดหมู่ (Admin) |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/dashboard` | ข้อมูล Dashboard |
| GET | `/reports/tickets` | รายงาน Tickets |

---

## Detailed Endpoints

### 1. Authentication

#### POST /auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 2. Tickets

#### GET /tickets
**Query Parameters:**
- `page` (number): หน้าที่ (default: 1)
- `limit` (number): จำนวนต่อหน้า (default: 10)
- `status` (string): กรองตามสถานะ
- `priority` (string): กรองตามความสำคัญ
- `category` (number): กรองตามหมวดหมู่
- `assignedTo` (number): กรองตามผู้รับผิดชอบ
- `search` (string): ค้นหาจาก title/description

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": 1,
        "ticketNumber": "IT-20250201-001",
        "title": "เครื่องคอมพิวเตอร์เปิดไม่ติด",
        "status": "open",
        "priority": "high",
        "category": {
          "id": 1,
          "name": "Hardware",
          "color": "#EF4444"
        },
        "requester": {
          "id": 2,
          "fullName": "Jane Smith",
          "department": "Sales"
        },
        "assignedTo": null,
        "createdAt": "2025-02-01T09:00:00Z",
        "slaDue": "2025-02-01T13:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### POST /tickets
**Request:**
```json
{
  "title": "เครื่องคอมพิวเตอร์เปิดไม่ติด",
  "description": "เมื่อกดปุ่มเปิดเครื่อง ไฟสีส้มกระพริบ 3 ครั้งแล้วดับ",
  "categoryId": 1,
  "priority": "high",
  "location": "ชั้น 3 ฝ่ายการตลาด",
  "assetTag": "PC-2023-042"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketNumber": "IT-20250201-001",
    "title": "เครื่องคอมพิวเตอร์เปิดไม่ติด",
    "status": "open",
    "priority": "high",
    "createdAt": "2025-02-01T09:00:00Z"
  }
}
```

#### POST /tickets/:id/comments
**Request:**
```json
{
  "content": "กำลังเดินทางไปตรวจสอบที่หน้างาน",
  "isInternal": false
}
```

#### POST /tickets/:id/status
**Request:**
```json
{
  "status": "in_progress",
  "comment": "เริ่มดำเนินการแก้ไข"
}
```

---

### 3. Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [ ... ]
  }
}
```

---

### Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - ข้อมูลไม่ถูกต้อง |
| 401 | Unauthorized - ไม่ได้ล็อกอิน |
| 403 | Forbidden - ไม่มีสิทธิ์ |
| 404 | Not Found - ไม่พบข้อมูล |
| 409 | Conflict - ข้อมูลซ้ำ |
| 422 | Validation Error - ข้อมูลไม่ผ่าน validation |
| 500 | Server Error - ข้อผิดพลาดของเซิร์ฟเวอร์ |

---

### Status Values
- `open` - รอดำเนินการ
- `in_progress` - กำลังดำเนินการ
- `waiting` - รอข้อมูลเพิ่มเติม
- `resolved` - แก้ไขแล้ว
- `closed` - ปิด Ticket
- `cancelled` - ยกเลิก

### Priority Values
- `low` - ต่ำ
- `medium` - ปานกลาง
- `high` - สูง
- `critical` - วิกฤติ

### Role Values
- `user` - ผู้ใช้ทั่วไป
- `it_staff` - เจ้าหน้าที่ IT
- `admin` - ผู้ดูแลระบบ
- `manager` - ผู้จัดการ
