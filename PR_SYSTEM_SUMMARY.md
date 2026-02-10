# 📦 Lean PR System - Summary

> ระบบ PR แบบเบา แต่ไม่เละ สำหรับทีม Dev 2-5 คน + AI Agents

---

## 📁 ไฟล์ที่สร้างแล้ว

| ไฟล์ | ทำอะไร | อ่านเมื่อไหร่ |
|------|--------|-------------|
| `BRANCH_WORKFLOW.md` | อธิบาย branch strategy | ครั้งแรก + ตอนงง |
| `CONTRIBUTING.md` | วิธีทำงานกับ repo | ก่อนเริ่ม contribute |
| `BRANCH_PROTECTION.md` | กติกา protection | Admin (Ball) ตั้งค่า |
| `.github/pull_request_template.md` | Template เปิด PR | อัตโนมัติตอนเปิด PR |
| `.pre-commit-config.yaml` | Hooks ขั้นพื้นฐาน | ตอนติดตั้ง pre-commit |

---

## 🌳 Branch Strategy (Simple)

```
feature/login ──→ develop ──→ main
     (PR #1)        (PR #2)
```

| Branch | Push | PR | Review | CI |
|--------|------|-----|--------|-----|
| `main` | ❌ ห้าม | ✅ บังคับ | ✅ 1 คน | ✅ ถ้ามี |
| `develop` | ❌ ห้าม | ✅ บังคับ | ❌ optional | ❌ optional |
| `feature/*` | ✅ ได้ | → develop | - | - |

---

## 🛡️ Branch Protection (ตั้งใน GitHub)

### main
- ✅ Require PR
- ✅ 1 approval
- ✅ CI pass
- ❌ No force push

### develop
- ✅ Require PR
- ❌ Review optional
- ❌ CI optional
- ❌ No force push

---

## 🚀 Quick Start สำหรับทีม

```bash
# 1. Clone
git clone git@github.com:apcball/DEV-Module-Odoo17.git
cd DEV-Module-Odoo17

# 2. ติดตั้ง pre-commit (แนะนำ)
pip install pre-commit
pre-commit install

# 3. อ่าน CONTRIBUTING.md
cat CONTRIBUTING.md

# 4. เริ่มงาน
git checkout develop
git checkout -b feature/ชื่องาน
```

---

## ⚡ สรุปกติกาสำคัญ

1. ❌ ห้าม push ตรง main
2. ✅ ทุกอย่างผ่าน PR
3. 👀 main ต้องมีคน review
4. 📝 ใช้ PR template
5. 🧪 test ก่อน push
6. 🔒 อย่าลืม secret

---

## 🔮 Optional (ตอนทีมโต)

| ของ | เพิ่มเมื่อไหร่ | ทำไม |
|-----|--------------|------|
| `CODEOWNERS` | มีหลาย module | กำหนด reviewer อัตโนมัติ |
| CI เต็มรูป | PR เยอะขึ้น | ป้องกัน regression |
| Commit convention | Auto-release | Generate changelog |
| Release branch | มี version ชัดเจน | แยก release ได้ |

---

## ❓ มีปัญหา?

- งง branch → อ่าน `BRANCH_WORKFLOW.md`
- งงกระบวนการ → อ่าน `CONTRIBUTING.md`
- งง technical → ถาม Ball หรือ Manow

---

🍋 **สร้างโดย Manow - Lean Policy Enforcer**
