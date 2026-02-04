# Model Selection Policy

> หลักการเลือก AI Model สำหรับ Manow (Main Orchestrator)

## 🎯 Default Rule

**ใช้ KIMI-2.5 เป็นค่าเริ่มต้น**

เปลี่ยนไปใช้ GLM-4.7 เฉพาะเมื่อจำเป็นจริง

---

## 🟢 ใช้ KIMI-2.5 (ค่าเริ่มต้น)

เลือกโมเดลนี้เมื่อ task เป็น:

- Planning / coordination / orchestration
- PR workflow / policy / guideline
- Documentation (CONTRIBUTING, README, prompt)
- UI/UX flow, copy, interaction
- Business logic ระดับทั่วไป
- QA review เชิง pattern / checklist
- งานที่ต้องการ speed + clarity

**หลักคิด:** ถ้าอธิบายให้คนในทีมฟังได้ง่าย → KIMI-2.5 พอ

---

## 🔵 Switch ไป GLM-4.7 (Auto-Upgrade)

เปลี่ยนโมเดลทันทีเมื่อพบหนึ่งในเงื่อนไขต่อไปนี้:

### 1. ความซับซ้อนของ reasoning
- Multi-step reasoning มากกว่า ~5 ขั้น
- มี dependency เชื่อมหลาย layer
- ต้องพิสูจน์ logic correctness

### 2. งานเชิงโครงสร้าง
- API design / schema
- Data model / migration
- Backward compatibility
- Refactor ใหญ่

### 3. Debug / Performance
- Bug trace ยาว
- Concurrency / async / race condition
- Performance tuning
- Memory / resource issue

### 4. Keyword Trigger
หาก task มีคำเหล่านี้ ให้ switch อัตโนมัติ:
```
refactor
optimize
migration
schema
contract
race condition
deadlock
backward compatibility
performance
```

---

## 🔁 Fallback Rule

หาก KIMI-2.5 ตอบแล้ว:
- reasoning ไม่ครบ
- logic ไม่มั่นใจ
- มี ambiguity สูง

➡️ **retry ด้วย GLM-4.7 โดยไม่ถาม**

---

## 🧩 Per-Agent Hint

ใช้ประกอบการตัดสินใจ:

| Agent | Task Type | Bias |
|-------|-----------|------|
| Suga (Backend) | API / Infra | GLM-4.7 |
| Meow (Design) | UX / Visual | KIMI-2.5 |
| Natjang (Frontend) | UI / React | KIMI-2.5 |
| Nova (Mobile) | Mobile dev | KIMI-2.5 |
| Krapuk (QA) | Edge case หนัก | GLM-4.7 |
| Krapuk (QA) | Checklist ทั่วไป | KIMI-2.5 |
| Kinjang (Analyst) | Requirements | KIMI-2.5 |

---

## 🎯 Goal Alignment

- ลด cost โดยไม่ลดคุณภาพ
- อย่าใช้ GLM-4.7 ถ้า KIMI-2.5 ทำได้ดีพอ
- อย่าใช้ KIMI-2.5 ถ้างานเสี่ยงพังระบบ

---

## 🧠 Final Decision Rule

> **"Start small, go deep only when needed."**

คุณมีอำนาจ override การเลือก model ได้ แต่ทุก override ต้องมีเหตุผลเชิงระบบ ไม่ใช่ preference

---

🍋 **Policy โดย: Manow - Main Orchestrator & Policy Enforcer**
