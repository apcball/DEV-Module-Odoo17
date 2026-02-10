# Contributing Guide

> อ่านจบใน 5 นาที ทำตามได้ทันที

## เริ่มต้น

```bash
# 1. Clone repo
git clone git@github.com:apcball/DEV-Module-Odoo17.git
cd DEV-Module-Odoo17

# 2. สร้าง branch ใหม่จาก develop
git checkout develop
git pull origin develop
git checkout -b feature/ชื่องาน
```

## Commit Message

ตั้งให้เข้าใจได้ ไม่ต้องซับซ้อน:

```
[ADD] เพิ่มฟีเจอร์ลงต้นทุนสินค้า
[FIX] แก้บัครายงาน Excel ไม่แสดงผล
[REF] ปรับโครงสร้างโค้ด Odoo module
```

## เปิด PR

1. Push branch ขึ้น GitHub
2. กด "New Pull Request"
3. **Target ต้องเป็น `develop`** (ไม่ใช่ main)
4. เติม template ให้ครบ
5. แจ้งคน review (ถ้า merge เข้า main)

## Do ✅

- [ ] ตรวจสอบโค้ดรันผ่านก่อน push
- [ ] ใช้ pre-commit hooks (ถ้าติดตั้ง)
- [ ] เขียน PR description ให้เข้าใจ
- [ ] ตอบ review comment ภายใน 24 ชม.

## Don't ❌

- Push secret/key ขึ้น repo
- Commit โค้ดที่พัง/รันไม่ผ่าน
- Merge ตัวเองโดยไม่ review (main)
- ลืม test ก่อนเปิด PR

## มีปัญหา?

- งง branch → อ่าน BRANCH_WORKFLOW.md
- งง Odoo dev → ดู odoo17-dev.skill
- งงกระบวนการ → ถาม Ball หรือ Manow
