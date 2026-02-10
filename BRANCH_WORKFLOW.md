# Git Workflow (อ่านจบใน 3 นาที)

## Branch ที่ใช้

| Branch | ใช้ทำอะไร | กติกา |
|--------|----------|--------|
| `main` | Production | ❌ ห้าม push ตรง ต้องผ่าน PR + review |
| `develop` | Integration | ✅ PR เข้าได้เลย review แนะนำแต่ไม่บังคับ |
| `feature/*` | งานใหม่/ทดลอง | แยกจาก develop เสร็จแล้ว PR เข้า develop |

## Flow งาน

```
feature/login-page → develop → main
      (PR #1)        (PR #2)
```

1. **เริ่มงานใหม่:** แยก branch จาก `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/ชื่องาน
   ```

2. **ทำงาน:** commit ตามปกติ

3. **เปิด PR:** เข้า `develop` (ไม่ใช่ main)

4. **Release:** ค่อย merge `develop` → `main`

## สรุปกติกา

- ❌ ห้าม push ตรงเข้า `main` เด็ดขาด
- ✅ ทุกการเปลี่ยนแปลงต้องผ่าน PR
- 👀 `main` ต้องมีคน review อย่างน้อย 1 คน
- 🤖 CI ต้องผ่าน (ถ้ามี)
