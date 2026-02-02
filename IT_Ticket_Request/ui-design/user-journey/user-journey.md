# IT Ticket Request Web App - User Journey & Flow

## 👥 User Roles

### 1. End User (User)
- สร้าง Ticket ขอความช่วยเหลือ
- ติดตามสถานะ Ticket ของตนเอง
- ตอบกลับ/เพิ่มข้อมูลใน Ticket

### 2. IT Staff
- รับ Ticket และดำเนินการแก้ไข
- อัพเดตสถานะ Ticket
- สื่อสารกับผู้ใช้ผ่านคอมเมนต์

### 3. Manager
- ดูภาพรวมสถิติ
- มอบหมายงานให้ IT Staff
- ตรวจสอบ SLA

### 4. Admin
- จัดการผู้ใช้งาน
- ตั้งค่าระบบ
- จัดการหมวดหมู่

---

## 🗺️ User Flows

### Flow 1: User - Create New Ticket

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ล็อกอิน   │────>│  Dashboard  │────>│ กด "สร้าง   │
│             │     │             │     │ Ticket ใหม่"│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                                                ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Ticket List │<────│  บันทึกสำเร็จ │<────│ กรอกฟอร์ม   │
│ (พร้อมแจ้ง  │     │  แสดง Ticket │     │ - หัวข้อ    │
│ เตือนใหม่)  │     │   Number     │     │ - หมวดหมู่   │
└─────────────┘     └─────────────┘     │ - รายละเอียด│
                                        │ - Priority  │
                                        │ - แนบไฟล์   │
                                        └─────────────┘
```

**Steps:**
1. User ล็อกอินเข้าระบบ
2. กดปุ่ม "สร้าง Ticket ใหม่" จาก Dashboard
3. กรอกฟอร์ม:
   - หัวข้อ (Title) - *required
   - หมวดหมู่ (Category) - *required
   - รายละเอียด (Description) - *required
   - ความเร่งด่วน (Priority) - default: Medium
   - แนบไฟล์ (Attachments) - optional
4. กด "สร้าง Ticket"
5. ระบบแสดง Ticket Number (IT-YYYYMMDD-XXX)
6. Redirect ไปหน้า Ticket List หรือ Ticket Detail

---

### Flow 2: User - Track Ticket Status

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ล็อกอิน   │────>│  Dashboard  │────>│ Ticket List │
│             │     │ (สรุปสถานะ) │     │  ของฉัน    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                   ┌────────────────────────────┘
                   │
                   ▼
            ┌─────────────┐     ┌─────────────┐
            │ Filter/Sort │<────│ Ticket Detail│
            │ (สถานะ/วันที่)│     │             │
            └─────────────┘     │ - รายละเอียด │
                                │ - ความคืบหน้า│
                                │ - คอมเมนต์   │
                                │ - ประวัติ    │
                                └─────────────┘
```

**Steps:**
1. User เข้า Dashboard เห็นสรุปสถานะ Ticket ของตน
2. กด "ดูทั้งหมด" หรือเมนู "Tickets"
3. ระบบแสดงรายการ Ticket ของ User
4. User สามารถ:
   - Filter ตามสถานะ
   - ค้นหาด้วย Ticket Number
   - Sort ตามวันที่สร้าง/อัพเดต
5. คลิกที่ Ticket เพื่อดูรายละเอียด
6. ดูประวัติการดำเนินงานและคอมเมนต์

---

### Flow 3: IT Staff - Process Ticket

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ล็อกอิน   │────>│  Dashboard  │────>│  Ticket List│
│ (IT Staff)  │     │ (สรุปงานที่  │     │  (ทั้งหมด)  │
│             │     │ รอดำเนินการ)│     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                   ┌────────────────────────────┘
                   │
                   ▼
            ┌─────────────┐     ┌─────────────┐
            │  Ticket     │────>│ ดำเนินการ:  │
            │   Detail    │     │             │
            │             │     │ 1. เปลี่ยน   │
            │ - ข้อมูลผู้  │     │    สถานะ    │
            │   แจ้ง     │     │ 2. มอบหมาย  │
            │ - รายละเอียด│     │ 3. เพิ่มคอมเมนต์│
            │ - ประวัติ   │     │ 4. แนบไฟล์   │
            └─────────────┘     └─────────────┘
```

**Steps:**
1. IT Staff ล็อกอิน เห็น Dashboard สรุปงาน
2. ดูรายการ Ticket ที่รอดำเนินการ
3. เลือก Ticket เข้าไปดูรายละเอียด
4. ดำเนินการ:
   - เปลี่ยนสถานะ (Open → In Progress → Resolved)
   - เพิ่มคอมเมนต์อธิบายการแก้ไข
   - แนบไฟล์เอกสาร/รูปภาพประกอบ
   - มอบหมายให้ Staff คนอื่น (ถ้าจำเป็น)
5. User ได้รับการแจ้งเตือนเมื่อมีอัพเดต

---

### Flow 4: Manager - Monitor & Report

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ล็อกอิน   │────>│  Dashboard  │────>│  Reports    │
│ (Manager)   │     │ (สถิติภาพรวม)│     │  รายละเอียด  │
└─────────────┘     └─────────────┘     └─────────────┘
                             │
                             ▼
                    ┌─────────────┐
                    │ การดำเนินการ │
                    │ ที่อาจต้องทำ │
                    │             │
                    │ - มอบหมายงาน│
                    │ - ตรวจสอบ SLA│
                    │ - ดูประวัติ  │
                    │   การทำงาน  │
                    └─────────────┘
```

**Steps:**
1. Manager เข้า Dashboard เห็นสถิติภาพรวม
2. ดูกราฟ/ตัวเลข:
   - จำนวน Ticket ตามสถานะ
   - จำนวน Ticket ตาม Priority
   - เวลาเฉลี่ยในการแก้ไข
   - SLA compliance rate
3. ตรวจสอบ Ticket ที่ใกล้/เกิน SLA
4. มอบหมายงานให้ IT Staff
5. ดูรายงานประจำเดือน

---

## 🖥️ Screen Flow Diagram

```
                         ┌─────────────┐
                         │    Login    │
                         │   /register │
                         └──────┬──────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │       Dashboard       │
                    │  ┌─────┐ ┌─────┐     │
                    │  │สถิติ │ │สร้าง │     │
                    │  │     │ │ใหม่  │     │
                    │  └─────┘ └─────┘     │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌───────────────┐
│  Ticket List  │     │  Create Ticket  │     │ User Profile  │
│  ┌─────────┐  │     │  ┌───────────┐  │     │  ┌─────────┐  │
│  │ Filter  │  │     │  │  ฟอร์ม   │  │     │  │ข้อมูล   │  │
│  │  Sort   │  │     │  │  กรอก    │  │     │  │ตั้งค่า  │  │
│  │  Search │  │     │  │  ข้อมูล   │  │     │  │ Logout  │  │
│  └────┬────┘  │     │  └─────┬─────┘  │     │  └─────────┘  │
└───────┼───────┘     └────────┼────────┘     └───────────────┘
        │                       │
        │                       ▼
        │              ┌─────────────────┐
        │              │ Ticket Created  │
        │              │ Show Ticket No. │
        │              └────────┬────────┘
        │                       │
        ▼                       │
┌───────────────┐              │
│ Ticket Detail │<─────────────┘
│  ┌─────────┐  │
│  │ข้อมูล   │  │
│  │คอมเมนต์ │  │
│  │ประวัติ  │  │
│  └─────────┘  │
└───────────────┘
```

---

## 🎯 Key Interactions

### 1. Creating a Ticket
- **Trigger**: Click "สร้าง Ticket ใหม่" button
- **Modal**: Full-page form for better focus
- **Validation**: Real-time validation with clear error messages
- **Success**: Toast notification + Show Ticket Number prominently

### 2. Ticket Status Updates
- **Trigger**: Staff changes status
- **Effect**: 
  - Status badge color change
  - Timeline update
  - Notification to User
  - Email notification (if enabled)

### 3. Adding Comments
- **Trigger**: Type comment + Submit
- **Effect**:
  - Real-time append to comment list
  - Auto-scroll to new comment
  - Notification to related parties

### 4. File Attachments
- **Trigger**: Drag-drop or click to select
- **Upload**: Progress bar
- **Preview**: Thumbnail for images, icon for documents
- **Download**: Click to download

### 5. Filtering/Sorting
- **Filter**: Dropdown/checkbox for Status, Priority, Category, Date range
- **Search**: Real-time search on Ticket Number, Title
- **Sort**: Click column header to sort

---

## 📊 State Transitions

### Ticket Status Flow
```
                    ┌──────────┐
         ┌─────────>│ Cancelled│
         │           └──────────┘
         │
┌────┐   ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌───────┐
│New │──>│  Open   │──>│In Progress│──>│Resolved │──>│Closed │
└────┘   └─────────┘   └──────────┘   └─────────┘   └───────┘
              │
              └──────────>┌─────────┐
                          │ Waiting │
                          └────┬────┘
                               └──────────> (back to Open)
```

**Transition Rules:**
- New → Open: Auto on creation
- Open → In Progress: Staff starts working
- Open → Waiting: Waiting for user response
- In Progress → Waiting: Need more info
- In Progress → Resolved: Issue fixed
- Waiting → Open: User responded
- Resolved → Closed: Auto after X days or manual
- Any → Cancelled: Admin only

---

## 🔔 Notification Flows

### 1. New Ticket Created
```
User creates ticket
       │
       ▼
┌─────────────┐
│ Save to DB  │
└──────┬──────┘
       │
       ├──────> Email to User (confirmation)
       ├──────> Email to IT Staff (new ticket alert)
       ├──────> In-app notification to Staff
       └──────> Dashboard stats update
```

### 2. Status Changed
```
Staff updates status
       │
       ▼
┌─────────────┐
│ Update DB   │
└──────┬──────┘
       │
       ├──────> Email to User (status update)
       ├──────> Add to ticket history
       └──────> Real-time UI update
```

### 3. New Comment
```
User/Staff adds comment
       │
       ▼
┌─────────────┐
│ Save comment│
└──────┬──────┘
       │
       ├──────> Email to other party
       ├──────> Real-time append to chat
       └──────> Add to history
```

---

## 🧩 Page-Specific Flows

### Dashboard (Role-based)

#### For User:
```
┌─────────────────────────────────────────┐
│ สวัสดี, [Name]                          │
├─────────────────────────────────────────┤
│ สรุป Ticket ของฉัน                      │
│ ┌────────┐┌────────┐┌────────┐┌───────┐│
│ │ กำลัง  ││ รอ     ││ แก้ไข  ││ ทั้งหมด││
│ │ ดำเนิน ││ ตอบกลับ││ แล้ว  ││       ││
│ │   3    ││   1    ││   12   ││  16   ││
│ └────────┘└────────┘└────────┘└───────┘│
├─────────────────────────────────────────┤
│ Ticket ล่าสุด                           │
│ [List of 5 recent tickets]              │
│ [ดูทั้งหมด →]                           │
├─────────────────────────────────────────┤
│ [+ สร้าง Ticket ใหม่]                   │
└─────────────────────────────────────────┘
```

#### For IT Staff:
```
┌─────────────────────────────────────────┐
│ สวัสดี, [Name] (IT Staff)               │
├─────────────────────────────────────────┤
│ งานที่ต้องดำเนินการ                     │
│ ┌────────┐┌────────┐┌────────┐┌───────┐│
│ │ รอรับ  ││ กำลัง  ││ รอ     ││ Critical│
│ │ งาน   ││ ทำ     ││ ตอบกลับ││   2   ││
│ │   5    ││   8    ││   3    ││       ││
│ └────────┘└────────┘└────────┘└───────┘│
├─────────────────────────────────────────┤
│ Ticket ใหม่ล่าสุด (ยังไม่รับงาน)        │
│ [List of new tickets]                   │
├─────────────────────────────────────────┤
│ งานที่กำลังทำ                           │
│ [List of in-progress tickets]           │
└─────────────────────────────────────────┘
```

#### For Manager:
```
┌─────────────────────────────────────────┐
│ สวัสดี, [Name] (Manager)                │
├─────────────────────────────────────────┤
│ สถิติภาพรวม (เดือนนี้)                  │
│ ┌────────┐┌────────┐┌────────┐┌───────┐│
│ │ สร้าง  ││ แก้ไข  ││ ค้าง   ││ Avg   ││
│ │ ใหม่   ││ แล้ว  ││ อยู่   ││ Time  ││
│ │  145   ││  132   ││   13   ││ 4.2h  ││
│ └────────┘└────────┘└────────┘└───────┘│
├─────────────────────────────────────────┤
│ กราฟ Ticket ตามสถานะ (รายวัน)          │
│ [Chart]                                 │
├─────────────────────────────────────────┤
│ SLA Compliance                          │
│ 95% - ดีมาก!                            │
├─────────────────────────────────────────┤
│ IT Staff Performance                    │
│ [Table: Staff name, Tickets resolved, Avg time]│
└─────────────────────────────────────────┘
```

---

## ✅ Success Criteria

### For Users:
- ✅ สร้าง Ticket ได้ในไม่เกิน 2 นาที
- ✅ ติดตามสถานะได้ง่าย
- ✅ ได้รับการแจ้งเตือนเมื่อมีความคืบหน้า
- ✅ สื่อสารกับ IT Staff ได้สะดวก

### For IT Staff:
- ✅ เห็นงานที่ต้องทำทั้งหมดในที่เดียว
- ✅ อัพเดตสถานะได้รวดเร็ว
- ✅ มีประวัติการทำงานครบถ้วน
- ✅ ไม่พลาดงานเร่งด่วน (Critical)

### For Managers:
- ✅ เห็นภาพรวมระบบ IT Support
- ✅ ตรวจสอบ SLA ได้ง่าย
- ✅ วิเคราะห์ประสิทธิภาพทีมได้
