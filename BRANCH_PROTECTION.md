# Branch Protection Policy

## main (Production)

```yaml
Require a pull request before merging: ✅
  - Required approvals: 1
  - Dismiss stale reviews: ✅
  - Require review from code owners: ❌ (ยังไม่มี)

Require status checks to pass: ✅ (ถ้ามี CI)
  - Require branches to be up to date: ✅

Require conversation resolution: ✅

Allow force pushes: ❌
Allow deletions: ❌
```

## develop (Integration)

```yaml
Require a pull request before merging: ✅
  - Required approvals: 0 (review แนะนำแต่ไม่บังคับ)

Require status checks: ❌ (optional)

Allow force pushes: ❌
Allow deletions: ❌
```

## การตั้งค่าใน GitHub

1. ไปที่ Settings → Branches
2. Add rule → Branch name pattern: `main`
3. ติ๊กตามด้านบน
4. สร้างอีก rule สำหรับ `develop`
5. Save

## สรุปกติกา (10 bullets)

1. ❌ ห้าม push ตรงเข้า main/develop
2. ✅ main: ต้องผ่าน PR + review 1 คน
3. ✅ develop: PR เท่านั้น review optional
4. ✅ ทุก PR ต้องใช้ template
5. ✅ CI ต้องผ่านถ้ามี
6. ✅ แก้ conflict ก่อน merge
7. ✅ pre-commit hooks แนะนำแต่ไม่บังคับ
8. ✅ feature/* → develop → main
9. ✅ Ball เป็นคน merge main เท่านั้น
10. ✅ งงให้ถาม อย่าเดาเอาเอง
