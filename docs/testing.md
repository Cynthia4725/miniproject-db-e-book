# Automated Testing and CI

## 1. Automated Testing

โครงงานใช้ **Vitest** สำหรับการทดสอบ Automated Test ของระบบ โดยมีการกำหนดค่าในไฟล์ `vitest.config.ts` และสามารถเรียกใช้งานผ่านคำสั่งใน `package.json`

### คำสั่งสำหรับรัน Test

```bash
npm test
```

หรือ

```bash
npx vitest run
```

### Test Framework

* Framework: **Vitest**
* Configuration: `vitest.config.ts`
* Test Command: `npm test`
* Purpose: ตรวจสอบการทำงานของส่วนต่าง ๆ ของระบบโดยอัตโนมัติ

### Test Result

> **สถานะ: ต้องบันทึกผลจากการรันจริง**

ตัวอย่างข้อมูลที่ควรบันทึกหลังจากรัน Test:

```text
Test Files: [จำนวนไฟล์ที่รันจริง]
Tests: [จำนวน Test ที่รันจริง]
Passed: [จำนวนที่ผ่าน]
Failed: [จำนวนที่ไม่ผ่าน]
Duration: [เวลาที่ใช้]
```

ไม่ควรใส่ตัวเลขสมมติ หากยังไม่ได้รันจริง

---

## 2. Continuous Integration (CI)

โครงงานมีการเตรียมโครงสร้างสำหรับ **Continuous Integration (CI)** ภายใน repository โดยใช้ workflow เพื่อให้สามารถตรวจสอบโค้ดและการทดสอบแบบอัตโนมัติได้

ตำแหน่งไฟล์ที่เกี่ยวข้อง:

```text
workflows/
```

CI มีหน้าที่ช่วยตรวจสอบว่าโค้ดที่นำขึ้น repository สามารถผ่านขั้นตอนที่กำหนด เช่น การติดตั้ง dependencies การ build และการทดสอบระบบ

### CI Result

> **สถานะ: ต้องตรวจสอบจาก GitHub Actions หลังจาก Workflow ทำงานจริง**

ผลที่ควรบันทึก:

| รายการ         | ผล                             |
| -------------- | ------------------------------ |
| Workflow       | [ชื่อ Workflow จริง]           |
| Trigger        | [push / pull request / อื่น ๆ] |
| Build          | [Passed / Failed]              |
| Automated Test | [Passed / Failed]              |
| CI Status      | [Passed / Failed]              |
| Run            | [ลิงก์ GitHub Actions Run]     |

---

## 3. Test and CI Evidence

หลักฐานสำหรับการตรวจสอบสามารถดูได้จาก:

* Automated Test configuration: `vitest.config.ts`
* Test command: `package.json`
* CI workflow: `workflows/`
* CI execution result: GitHub Actions

### สรุปสถานะ

| หัวข้อ                      | สถานะ              |
| --------------------------- | ------------------ |
| มี Automated Test Framework | ✅                  |
| มี Test Configuration       | ✅                  |
| มีคำสั่งสำหรับรัน Test      | ✅                  |
| มีโครงสร้าง CI              | ✅                  |
| มีผลการรัน Test จริง        | ⬜ ต้องรันและบันทึก |
| มีผล CI Run จริง            | ⬜ ต้องรันและบันทึก |

**หมายเหตุ:** ผลการทดสอบและผล CI ต้องใช้ผลจากการรันจริงของ repository ไม่ควรสร้างผลลัพธ์ขึ้นมาเอง
