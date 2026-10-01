# AI Collaboration & Disclosure Log

เอกสารนี้จัดทำขึ้นเพื่อแสดงความโปร่งใสและการใช้งาน AI อย่างมีความรับผิดชอบ (Responsible AI Usage) สำหรับโครงงานวิชา Database ระบบร้านขาย E-Book

---

## 1. ข้อมูลทั่วไปของโครงงาน (Project Overview)
- **ชื่อโครงงาน**: E-Book Store Management & Analytics System
- **วิชา**: Database Systems
- **สถาปัตยกรรมหลัก**: PostgreSQL (Neon Database) + Web Application (Vercel)
- **เครื่องมือ AI ที่ใช้**: Antigravity AI Assistant

---

## 2. ขอบเขตการทำงานร่วมกับ AI (AI Collaboration Scope)

| ด้าน | บทบาทของนักศึกษา (Human Role) | บทบาทของ AI (AI Assistant Role) |
|---|---|---|
| **1. System Architecture & Workflows** | กำหนดขอบเขตระบบ, เลือกระบบการชำระเงิน, ตัดสินใจ Business Rules | เสนอทางเลือก, ช่วยท้าทายประเด็นความเสี่ยง (Grilling), สรุป Spec Workflow |
| **2. Schema Design & Normalization** | ตรวจสอบ Business Entities, กำหนด Cardinality, อนุมัติความถูกต้อง | แนะนำการทำ Normalization (1NF-3NF), เสนอ Foreign Key Constraints & Triggers |
| **3. Sample Data Mocking** | กำหนดสถานการณ์ธุรกิจ (Scenario) และปริมาณข้อมูลจำลอง | ช่วยสร้าง SQL Script ชุดข้อมูลจำลองที่สอดคล้องกับ Relational Integrity |
| **4. Query Optimization & Analytics** | กำหนด Business Questions และเกณฑ์ชี้วัดทางธุรกิจ (KPIs) | ช่วยร่าง SQL Query ซับซ้อน (Window functions, CTE, Aggregations) |

---

## 3. บันทึกประวัติการตัดสินใจและการใช้ AI (Activity Log)

### รอบที่ 1: Architectural Foundation & Project Scope
- **วันที่**: 2026-10-01
- **โจทย์ที่ป้อนให้ AI**: วางกรอบระบบร้านขาย E-Book ตามเกณฑ์ส่งอาจารย์ (Database design, Prototype, SQL reports, Responsible AI)
- **สิ่งที่ AI นำเสนอ**: แนะนำ PostgreSQL, กระบวนการสั่งซื้อ Cart & Order Items, โมเดลการชำระเงิน Slip Verification, และหัวข้อ SQL Analytics 5 มิติ
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - อนุมัติใช้ PostgreSQL บน Neon + Vercel
  - เลือก Flow ชำระเงินแบบ B (Upload Slip + Admin Approval) เพื่อให้เห็น Relational State Machine ชัดเจน
  - ยืนยันการจัดทำเอกสาร `AI_DISCLOSURE.md` อย่างเป็นทางการ

### รอบที่ 2: Entity Modeling, Relationships & State Machine
- **วันที่**: 2026-10-01
- **โจทย์ที่ป้อนให้ AI**: ทบทวนโครงสร้างตารางผู้ใช้ แค็ตตาล็อกหนังสือ วงจรสถานะคำสั่งซื้อ และระบบความปลอดภัยการดาวน์โหลด
- **สิ่งที่ AI นำเสนอ**:
  - แนะนำตาราง `users` รวม พร้อมสิทธิ์ `role` ENUM เพื่อลดความซ้ำซ้อน
  - แนะนำความสัมพันธ์ Many-to-Many (`book_categories`) เพื่อแสดง Normalization 3NF
  - แนะนำ Price Snapshot ใน `order_items` และแยกตาราง `payments` เพื่อรองรับ Transaction State Machine
  - แนะนำโมเดล `user_library`, `download_tokens`, และ `download_logs`
  - แนะนำการเพิ่มตาราง `coupons` เพื่อเพิ่มมิติการวิเคราะห์ SQL
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - อนุมัติตามคำแนะนำทั้งหมด เพื่อให้ครอบคลุมเกณฑ์การให้คะแนนวิชา Database อย่างสมบูรณ์

### รอบที่ 3: Key Strategy, Asset Architecture, Data Scale & Screen Scope
- **วันที่**: 2026-10-01
- **โจทย์ที่ป้อนให้ AI**: วางกลยุทธ์ Primary Key, การจัดเก็บไฟล์ PDF/รูปภาพสำหรับ Demo, สเกลข้อมูลจำลองสำหรับเขียน SQL, และขอบเขตหน้าจอ Prototype
- **สิ่งที่ AI นำเสนอ**:
  - แนะนำ Hybrid Key Strategy: `BIGINT` เป็น Internal PK และ UUID v4 สำหรับรหัสคำสั่งซื้อและโทเคนดาวน์โหลด
  - แนะนำ Zero-dependency Asset Strategy: รูปปกผ่าน URL และไฟล์ PDF ตัวอย่างจริงใน `/public/sample-ebook.pdf`
  - แนะนำธีม Tech & Business E-Books พร้อมขนาดข้อมูล 20 เล่ม, 5 หมวดหมู่, 30 คำสั่งซื้อย้อนหลัง 3-4 เดือน
  - กำหนดขอบเขต 8 หน้าจอ (5 หน้าสำหรับลูกค้า + 3 หน้าสำหรับผู้ดูแลร้าน)
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - อนุมัติตามคำแนะนำทั้งหมด มุ่งเน้นความน่าเชื่อถือของการสาธิตและคุณภาพของข้อมูลเชิงวิเคราะห์


