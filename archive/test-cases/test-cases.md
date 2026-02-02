# Test Cases - IT Ticket Request Web App

## Test Suite: Authentication

### TC-AUTH-001: User Login
**Objective:** ตรวจสอบการเข้าสู่ระบบ
**Preconditions:** มีบัญชีผู้ใช้ในระบบ
**Steps:**
1. เปิดหน้า login.html
2. กรอก email และ password ที่ถูกต้อง
3. คลิกปุ่ม "เข้าสู่ระบบ"

**Expected Result:**
- Login สำเร็จ
- Redirect ไปหน้า dashboard
- Token ถูกเก็บใน localStorage

**Status:** 🔴 Fail (BUG-001)

---

### TC-AUTH-002: User Registration
**Objective:** ตรวจสอบการสมัครสมาชิก
**Steps:**
1. เปิดหน้า login.html
2. คลิก tab "สมัครสมาชิก"
3. กรอกข้อมูลให้ครบถ้วน
4. คลิกปุ่ม "สมัครสมาชิก"

**Expected Result:**
- Register สำเร็จ
- Redirect ไปหน้า dashboard

**Status:** 🔴 Fail (BUG-001)

---

## Test Suite: Tickets

### TC-TICKET-001: Create Ticket
**Objective:** สร้าง Ticket ใหม่
**Steps:**
1. Login เข้าระบบ
2. ไปที่หน้า create-ticket.html
3. กรอกข้อมูล Ticket
4. คลิก "สร้าง Ticket"

**Expected Result:**
- Ticket ถูกสร้าง
- แสดง Ticket Number
- Redirect ไปหน้า tickets

**Status:** 🔴 Fail (BUG-001)

---

### TC-TICKET-002: View Ticket List
**Objective:** ดูรายการ Ticket
**Steps:**
1. Login เข้าระบบ
2. ไปที่หน้า tickets.html

**Expected Result:**
- แสดงรายการ Ticket
- Pagination ทำงาน
- Filter ทำงาน

**Status:** 🔴 Fail (BUG-001)

---

### TC-TICKET-003: Update Ticket Status
**Objective:** เปลี่ยนสถานะ Ticket
**Steps:**
1. เปิด Ticket detail
2. เลือกสถานะใหม่
3. คลิก "บันทึก"

**Expected Result:**
- สถานะถูกอัพเดท
- History ถูกบันทึก

**Status:** 🔴 Fail (BUG-002)

---

### TC-TICKET-004: Assign Ticket
**Objective:** มอบหมาย Ticket
**Steps:**
1. เปิด Ticket detail
2. เลือกผู้รับผิดชอบ
3. คลิก "มอบหมาย"

**Expected Result:**
- Ticket ถูกมอบหมาย
- แสดงชื่อผู้รับผิดชอบ

**Status:** 🔴 Fail (BUG-003)

---

### TC-TICKET-005: Add Comment
**Objective:** เพิ่มความคิดเห็น
**Steps:**
1. เปิด Ticket detail
2. พิมพ์ความคิดเห็น
3. คลิก "ส่ง"

**Expected Result:**
- Comment ปรากฏในรายการ

**Status:** 🔴 Fail (BUG-001)

---

## Test Suite: Dashboard

### TC-DASH-001: View Statistics
**Objective:** ดูสถิติบน Dashboard
**Steps:**
1. Login เข้าระบบ
2. ไปที่หน้า dashboard.html

**Expected Result:**
- แสดงสถิติต่างๆ
- แสดงกราฟ (ถ้ามี)

**Status:** 🔴 Fail (BUG-001)

---

## Test Suite: User Profile

### TC-PROFILE-001: Update Profile
**Objective:** แก้ไขข้อมูลส่วนตัว
**Steps:**
1. ไปที่หน้า profile.html
2. แก้ไขข้อมูล
3. คลิก "บันทึก"

**Expected Result:**
- ข้อมูลถูกอัพเดท

**Status:** 🔴 Fail (Backend missing endpoint)

---

### TC-PROFILE-002: Change Password
**Objective:** เปลี่ยนรหัสผ่าน
**Steps:**
1. ไปที่หน้า profile.html
2. คลิก "เปลี่ยนรหัสผ่าน"
3. กรอกรหัสผ่านเก่าและใหม่
4. คลิก "บันทึก"

**Expected Result:**
- รหัสผ่านถูกเปลี่ยน

**Status:** 🔴 Fail (Backend missing endpoint)

---

## Summary

| Test Suite | Total | Pass | Fail | Blocked |
|------------|-------|------|------|---------|
| Authentication | 2 | 0 | 2 | 0 |
| Tickets | 5 | 0 | 5 | 0 |
| Dashboard | 1 | 0 | 1 | 0 |
| User Profile | 2 | 0 | 2 | 0 |
| **Total** | **10** | **0** | **10** | **0** |

**Note:** ทุก Test Case ล้มเหลวเนื่องจาก BUG-001 (API URL mismatch)
