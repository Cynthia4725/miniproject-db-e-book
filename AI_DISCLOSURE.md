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

### รอบที่ 4: Architectural Decision Records (ADRs) & Domain Refinement (/grill-with-docs)
- **วันที่**: 2026-10-01
- **โจทย์ที่ป้อนให้ AI**: ทบทวนและสร้างเอกสาร Architecture Decision Records (ADRs) ให้ครบถ้วน เพื่อบันทึกเหตุผลการตัดสินใจทางสถาปัตยกรรม (Architectural Trade-offs) และปรับปรุง GLOSSARY.md ให้กระชับตามหลัก Domain Modeling
- **สิ่งที่ AI นำเสนอ**:
  - รีแฟกเตอร์ [GLOSSARY.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/GLOSSARY.md) โดยตัด Implementation details ออก และระบุคำนิยามพร้อม `_Avoid_`
  - เสนอและร่าง ADR เพิ่มเติม 4 ฉบับ:
    - [ADR 0003](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0003-neon-serverless-postgresql.md): การเลือกใช้ Neon Serverless PostgreSQL + Direct SQL Query (ไม่ใช้ Heavy ORM)
    - [ADR 0004](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0004-relational-junction-tables-over-jsonb.md): การใช้ Junction Table ตามกฎ 3NF แทน Native Postgres JSONB/Array
    - [ADR 0005](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0005-zero-external-dependency-asset-delivery.md): กลยุทธ์การส่งมอบไฟล์แบบ Zero External Dependency สำหรับ Live Demo
    - [ADR 0006](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0006-database-backed-cart-persistence.md): การใช้ Database-backed Cart แทน Browser LocalStorage
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - อนุมัติการบันทึก ADR ทั้งหมด 6 ฉบับอย่างเป็นทางการ

### รอบที่ 5: Feature Specification Synthesis (/to-spec)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: สังเคราะห์และสร้างเอกสาร Specification ฉบับสมบูรณ์สำหรับ ADR-0001 (Hybrid Identifier Strategy)
- **สิ่งที่ AI นำเสนอ**:
  - ร่างจุดทดสอบ (Test Seams) ระดับสูงสุดที่จุดเชื่อมต่อ Data Access & DTO Mapping
  - สังเคราะห์ User Stories แบบละเอียดครอบคลุม Customer, Admin, Security Auditor, DB Evaluator, และ Developer
  - กำหนด Implementation Decisions และ Testing Decisions ตามเทมเพลตมาตรฐาน และบันทึกเป็นเอกสาร [0001-hybrid-id-strategy.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0001-hybrid-id-strategy.md) ติดป้ายกำกับ `ready-for-agent`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ยืนยันความเห็นชอบต่อขอบเขตและ Seams การทดสอบของสเปก

### รอบที่ 6: Web Application Stack Specification (/grill-with-docs)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ระบุสแตกของ Web Application ที่จะนำไป Deploy บน Vercel โดยเลือกใช้ Next.js
- **สิ่งที่ AI นำเสนอ**:
  - ท้าทายและนำเสนอสถาปัตยกรรม Next.js App Router (React Server Components + Server Actions)
  - แนะนำการรัน Parameterized Raw SQL ตรงๆ ผ่าน `@neondatabase/serverless` HTTP driver ป้องกันปัญหา Connection Exhaustion
  - แนะนำระบบ Session Cookie ที่มี Demo Account Switcher เพื่อให้กรรมการตรวจงานสลับบทบาท Customer/Admin ได้สะดวก
  - แนะนำการใช้ Tailwind CSS สำหรับจัดสไตล์
  - บันทึกเป็นเอกสาร [ADR 0007: Next.js App Router Architecture with Direct Neon SQL Execution](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0007-nextjs-app-router-and-neon-sql.md)
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - อนุมัติตามคำแนะนำทั้งหมด เพื่อให้สแตกฝั่งเว็บสนับสนุนการเขียนคำสั่ง SQL สำหรับวิชา Database ได้อย่างสมบูรณ์แบบ

### รอบที่ 7: Feature Specification Synthesis for ADR-0002 (/to-spec)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: สังเคราะห์และสร้างเอกสาร Specification ฉบับสมบูรณ์สำหรับ ADR-0002 (Order Payment Lifecycle and Decoupled Fulfillment)
- **สิ่งที่ AI นำเสนอ**:
  - ร่างจุดทดสอบ (Test Seams) ระดับสูงสุดที่จุดเชื่อมต่อ Order & Payment Lifecycle Seam (The State Machine & Transaction Boundary)
  - สังเคราะห์ User Stories แบบละเอียด 18 ข้อ ครอบคลุม Customer, Store Admin, Database Evaluator/อาจารย์, และ Security Auditor
  - กำหนด Implementation Decisions และ Testing Decisions ตามเทมเพลตมาตรฐาน และบันทึกเป็นเอกสาร [0002-order-payment-fulfillment-state-machine.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0002-order-payment-fulfillment-state-machine.md) ติดป้ายกำกับ `ready-for-agent`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ยืนยันความเห็นชอบต่อขอบเขตและ Seams การทดสอบของสเปก

### รอบที่ 8: Feature Specification Synthesis for ADR-0003 (/to-spec)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: สังเคราะห์และสร้างเอกสาร Specification ฉบับสมบูรณ์สำหรับ ADR-0003 (Neon Serverless PostgreSQL with Direct SQL Queries)
- **สิ่งที่ AI นำเสนอ**:
  - ร่างจุดทดสอบ (Test Seams) ระดับสูงสุดที่จุดเชื่อมต่อ Database Client & Query Execution Boundary (The Neon SQL Execution Seam)
  - สังเคราะห์ User Stories 15 ข้อ ครอบคลุม Database Evaluator/อาจารย์, Student Developer, DevOps, Customer, Store Admin, และ Security Auditor
  - กำหนด Implementation Decisions เรื่อง HTTP driver, Parameterized query tagging, Transaction management, และ Constraint error mapping
  - บันทึกเป็นเอกสาร [0003-neon-serverless-postgresql.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0003-neon-serverless-postgresql.md) ติดป้ายกำกับ `ready-for-agent`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ยืนยันความเห็นชอบต่อขอบเขตและ Seams การทดสอบของสเปก

### รอบที่ 9: Feature Specification Synthesis for ADR-0004 (/to-spec)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: สังเคราะห์และสร้างเอกสาร Specification ฉบับสมบูรณ์สำหรับ ADR-0004 (Relational Junction Tables Over PostgreSQL JSONB or Native Arrays)
- **สิ่งที่ AI นำเสนอ**:
  - ร่างจุดทดสอบ (Test Seams) ระดับสูงสุดที่จุดเชื่อมต่อ Catalog Relational Boundary (The Catalog Data Access & Constraint Seam)
  - สังเคราะห์ User Stories 15 ข้อ ครอบคลุม Customer, Store Admin, Database Evaluator/อาจารย์, DBA, และ Developer
  - กำหนด Implementation Decisions เกี่ยวกับตาราง `book_categories`, `book_authors`, Composite Primary Keys, Foreign Key Cascades, และการทำ Normalization (1NF–3NF/BCNF)
  - บันทึกเป็นเอกสาร [0004-relational-junction-tables-over-jsonb.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0004-relational-junction-tables-over-jsonb.md) ติดป้ายกำกับ `ready-for-agent`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ยืนยันความเห็นชอบต่อขอบเขตและ Seams การทดสอบของสเปก

### รอบที่ 10: Feature Specification Synthesis for ADR-0005 (/to-spec)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: สังเคราะห์และสร้างเอกสาร Specification ฉบับสมบูรณ์สำหรับ ADR-0005 (Zero-External-Dependency Digital Asset Delivery Strategy)
- **สิ่งที่ AI นำเสนอ**:
  - ร่างจุดทดสอบ (Test Seams) ระดับสูงสุดที่จุดเชื่อมต่อ Asset Delivery & Telemetry Boundary (The Download Gateway Seam)
  - สังเคราะห์ User Stories 15 ข้อ ครอบคลุม Customer, Store Admin, Database Evaluator/อาจารย์, Security Auditor, และ DevOps
  - กำหนด Implementation Decisions เรื่องการเสิร์ฟไฟล์ PDF จริงจาก `/public/sample-ebook.pdf`, การตรวจสอบวันหมดอายุ/โควตา, และการบันทึกประวัติลง `download_logs`
  - บันทึกเป็นเอกสาร [0005-zero-external-dependency-asset-delivery.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0005-zero-external-dependency-asset-delivery.md) ติดป้ายกำกับ `ready-for-agent`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ยืนยันความเห็นชอบต่อขอบเขตและ Seams การทดสอบของสเปก

### รอบที่ 11: Feature Specification Synthesis for ADR-0006 (/to-spec)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: สังเคราะห์และสร้างเอกสาร Specification ฉบับสมบูรณ์สำหรับ ADR-0006 (Database-Backed Cart Persistence Over Client-Side LocalStorage)
- **สิ่งที่ AI นำเสนอ**:
  - ร่างจุดทดสอบ (Test Seams) ระดับสูงสุดที่จุดเชื่อมต่อ Cart Management Boundary (The Cart Service & Checkout Transaction Seam)
  - สังเคราะห์ User Stories 15 ข้อ ครอบคลุม Customer, Store Admin, Database Evaluator/อาจารย์, DBA, และ Developer
  - กำหนด Implementation Decisions เรื่องโครงสร้าง `carts`, `cart_items`, กฎ `UNIQUE (cart_id, book_id)` ป้องกันหนังสือซ้ำ, การทำ `ON DELETE CASCADE`, และกระบวนการย้ายข้อมูลไป `order_items` พร้อมล้างตะกร้าแบบ Atomic
  - บันทึกเป็นเอกสาร [0006-database-backed-cart-persistence.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0006-database-backed-cart-persistence.md) ติดป้ายกำกับ `ready-for-agent`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ยืนยันความเห็นชอบต่อขอบเขตและ Seams การทดสอบของสเปก

### รอบที่ 12: Feature Specification Synthesis for ADR-0007 (/to-spec)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: สังเคราะห์และสร้างเอกสาร Specification ฉบับสมบูรณ์สำหรับ ADR-0007 (Next.js App Router Architecture with Direct Neon SQL Execution)
- **สิ่งที่ AI นำเสนอ**:
  - ร่างจุดทดสอบ (Test Seams) ระดับสูงสุดที่จุดเชื่อมต่อ Server Action & Authentication Session Boundary (The Next.js Application Seam)
  - สังเคราะห์ User Stories 15 ข้อ ครอบคลุม Customer, Store Admin, Database Evaluator/อาจารย์, Security Auditor, และ Developer
  - กำหนด Implementation Decisions ครอบคลุมโครงสร้าง 8 หน้าจอหลัก, การทำ Session Cookie พร้อม Demo Account Switcher, การคุ้มครอง Route ผู้ดูแลร้าน, และการรัน Server Actions ด้วย Parameterized SQL
  - บันทึกเป็นเอกสาร [0007-nextjs-app-router-and-neon-sql.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0007-nextjs-app-router-and-neon-sql.md) ติดป้ายกำกับ `ready-for-agent`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ยืนยันความเห็นชอบต่อขอบเขตและ Seams การทดสอบของสเปก

### รอบที่ 13: Tracer-Bullet Ticket Breakdown for Spec-0001 (/to-tickets)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ย่อยเอกสารข้อกำหนด Spec-0001 (Hybrid Identifier Strategy) ออกเป็นชุดงานย่อยแบบ Tracer-Bullet Tickets ที่มี Blocking Edges ชัดเจน
- **สิ่งที่ AI นำเสนอ**:
  - เสนอการซอยงานเป็น 3 Vertical Slices:
    1. Ticket 01: Order Public UUID Identification & Lookup Slice (ไม่ถูกบล็อก เริ่มได้ทันที)
    2. Ticket 02: Download Token UUID Generation & Gated Verification Slice (ถูกบล็อกโดย Ticket 01)
    3. Ticket 03: Public DTO Sanitization & Tamper-Proof Error Handling Slice (ถูกบล็อกโดย Ticket 01 และ 02)
  - กำหนด Acceptance Criteria พร้อม Checkbox ในแต่ละ Ticket และบันทึกลงใน `.scratch/0001-hybrid-id-strategy/issues/`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ตรวจสอบและยืนยันการแบ่ง Tickets และลำดับ Blocking Edges ทั้งหมด

### รอบที่ 14: Implementation & Test-Driven Development (/implement, /tdd)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ลงมือพัฒนาโค้ดตาม Tickets ของ Spec-0001 ทั้งหมด โดยยึดหลัก TDD (Red-Green-Refactor)
- **สิ่งที่ AI นำเสนอ**:
  - พัฒนาโครงสร้าง DDL สมบูรณ์ [src/db/schema.sql](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/db/schema.sql) รองรับ 16 ตารางและ B-Tree Indexes
  - สร้างโมดูล [src/modules/orders/order.repository.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/modules/orders/order.repository.ts) (Ticket 01) พร้อมชุดทดสอบ TDD 6 เคส ผ่าน 100%
  - สร้างโมดูล [src/modules/fulfillment/token.repository.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/modules/fulfillment/token.repository.ts) (Ticket 02) พร้อมชุดทดสอบ TDD 7 เคส ผ่าน 100%
  - สร้างโมดูลความปลอดภัยและ DTO [src/lib/sanitizer.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/lib/sanitizer.ts) (Ticket 03) พร้อมชุดทดสอบ TDD 6 เคส ผ่าน 100%
  - ตรวจสอบ Typecheck (`tsc --noEmit`) และ Vitest Suite ทั้งหมด 19/19 เคสผ่านฉลุย
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - อนุมัติการรันและยอมรับผลลัพธ์ของโค้ดและการทดสอบทั้งหมด

### รอบที่ 15: Tracer-Bullet Ticket Breakdown for Spec-0002 (/to-tickets)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ย่อยเอกสารข้อกำหนด Spec-0002 (Order Payment Lifecycle and Decoupled Fulfillment) ออกเป็นชุดงานย่อยแบบ Tracer-Bullet Tickets
- **สิ่งที่ AI นำเสนอ**:
  - เสนอการซอยงานเป็น 3 Vertical Slices:
    1. Ticket 01: Payment Slip Submission & State Transition Slice (เริ่มได้ทันที)
    2. Ticket 02: Admin Payment Verification & Atomic Fulfillment Slice (บล็อกโดย Ticket 01)
    3. Ticket 03: Gated Library Ownership & Download Audit Telemetry Slice (บล็อกโดย Ticket 02)
  - สร้างไฟล์ Ticket ทั้ง 3 ฉบับพร้อม Acceptance Criteria ครบถ้วนใน `.scratch/0002-order-payment-fulfillment-state-machine/issues/`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ตรวจสอบและยืนยันการแบ่ง Tickets และลำดับการส่งมอบทั้งหมด

### รอบที่ 16: Implementation & Test-Driven Development for Spec-0002 (/implement, /tdd)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ลงมือพัฒนาโค้ดตาม Tickets ของ Spec-0002 (Order Payment Lifecycle and Decoupled Fulfillment) ทั้ง 3 Tickets โดยยึดหลัก TDD (Red-Green-Refactor)
- **สิ่งที่ AI นำเสนอ**:
  - สร้างโมดูล [src/modules/payments/payment.repository.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/modules/payments/payment.repository.ts) และ DTO:
    - Ticket 01: เพิ่ม `submitPaymentSlip` จัดการการส่งหลักฐานสลิปโอนเงิน บันทึกลงตาราง `payments` สถานะ `PENDING_REVIEW` และทรานซิชันสถานะคำสั่งซื้อจาก `PENDING` เป็น `PAYMENT_SUBMITTED` แบบอะตอมิก พร้อมระบบป้องกันทรานซิชันซ้ำหรือสั่งซื้อที่อยู่ในสถานะ Terminal
    - Ticket 02: เพิ่ม `reviewPayment` ให้แอดมินอนุมัติหรือปฏิเสธคำสั่งซื้อ โดยหากอนุมัติจะอัปเดตสถานะเป็น `APPROVED` และ `PAID` พร้อมทั้งมอบกรรมสิทธิ์ดิจิทัลลงในตาราง `user_library` และสร้าง `download_tokens` อายุ 30 วัน โควตา 5 ครั้งทันที หากปฏิเสธต้องระบุเหตุผลและไม่สร้างสินทรัพย์ใดๆ
  - พัฒนาโมดูล [src/modules/fulfillment/library.repository.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/modules/fulfillment/library.repository.ts) (Ticket 03):
    - พัฒนา `getUserLibrary` กรองเฉพาะหนังสือที่มาจากคำสั่งซื้อที่ได้รับการอนุมัติ (`PAID`) เท่านั้น หนังสือที่ยังไม่จ่ายเงิน รอตรวจสอบ หรือถูกปฏิเสธจะไม่แสดงในคลังเด็ดขาด
    - เพิ่มเมธอด Audit Telemetry สำหรับรวมสถิติการดาวน์โหลดรายหนังสือ (`getDownloadAuditStatsByBook`) และรายผู้ใช้ (`getDownloadAuditStatsByUser`) จากตาราง `download_logs`
  - เขียนและรันชุดการทดสอบ TDD ทั้ง 3 Vertical Slices (รวม 25 เคสใหม่) ผ่าน 100% รวมชุดทดสอบของระบบเป็น 44 เคสผ่านฉลุย
  - ตรวจสอบความถูกต้องของ Typecheck (`tsc --noEmit`) ปราศจากข้อผิดพลาด
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - สั่งเริ่มการอิมพลีเมนต์ตามสเปกและยอมรับผลการตรวจสอบการทำงานทั้งหมด

### รอบที่ 17: Tracer-Bullet Ticket Breakdown for Spec-0003 (/to-tickets)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ย่อยเอกสารข้อกำหนด Spec-0003 (Neon Serverless PostgreSQL with Direct SQL Queries) ออกเป็นชุดงานย่อยแบบ Tracer-Bullet Tickets
- **สิ่งที่ AI นำเสนอ**:
  - เสนอการซอยงานเป็น 3 Vertical Slices:
    1. Ticket 01: Parameterized Direct SQL Client & PostgreSQL Error Mapping Slice (เริ่มได้ทันที)
    2. Ticket 02: Atomic Multi-Query Transaction Execution & Rollback Slice (บล็อกโดย Ticket 01)
    3. Ticket 03: Native SQL Business Intelligence & Advanced Analytics Suite Slice (บล็อกโดย Ticket 01)
  - สร้างไฟล์ Ticket ทั้ง 3 ฉบับพร้อม Acceptance Criteria ครบถ้วนใน `.scratch/0003-neon-serverless-postgresql/issues/`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ตรวจสอบและยืนยันการแบ่ง Tickets และลำดับ Blocking Edges ทั้งหมด

### รอบที่ 18: Implementation & Test-Driven Development for Spec-0003 (/implement, /tdd)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ลงมือพัฒนาโค้ดตาม Tickets ของ Spec-0003 (Neon Serverless PostgreSQL with Direct SQL Queries) ทั้ง 3 Tickets โดยยึดหลัก TDD (Red-Green-Refactor)
- **สิ่งที่ AI นำเสนอ**:
  - พัฒนาโมดูล [src/db/client.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/db/client.ts) (Ticket 01):
    - รองรับ Parameterized Queries และ Tagged Template `sql` syntax ป้องกัน SQL Injection อย่างเด็ดขาด
    - พัฒนาระบบ `mapDatabaseError` แปลง Error Code ของ PostgreSQL (`23505`, `23503`, `23514`) เป็น Typed Domain Errors (`ConflictError`, `NotFoundError`, `ValidationError`)
    - เพิ่ม `sanitizeDatabaseErrorMessage` ป้องกันการรั่วไหลของ Connection String และรหัสผ่านฐานข้อมูล
  - พัฒนาโมดูล [src/db/transaction.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/db/transaction.ts) (Ticket 02):
    - สร้างยูทิลิตี้ `runTransaction` จัดการ ACID Atomicity พร้อมระบบ Rollback ปลอดภัยเมื่อเกิดข้อผิดพลาด
  - พัฒนาโมดูล [src/modules/analytics/analytics.repository.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/modules/analytics/analytics.repository.ts) (Ticket 03):
    - อิมพลีเมนต์ 5 มิติรายงานเชิงลึก (Category Revenue, Top 5 Best-Selling CTE + `DENSE_RANK()`, Customer LTV, Download Velocity `EXTRACT(EPOCH)`, Monthly Trends CTE + `LAG()`)
  - เขียนและรันชุดทดสอบ TDD 3 ชุดใหม่ (รวม 14 เคสใหม่) ผ่าน 100% รวมชุดทดสอบของระบบเป็น 58 เคสผ่านฉลุย
  - ตรวจสอบ Typecheck (`tsc --noEmit`) 0 errors
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - สั่งเริ่มการอิมพลีเมนต์ตามสเปกและยอมรับผลการตรวจสอบการทำงานทั้งหมด

### รอบที่ 19: Tracer-Bullet Ticket Breakdown for Spec-0004 (/to-tickets)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ย่อยเอกสารข้อกำหนด Spec-0004 (Relational Junction Tables Over PostgreSQL JSONB or Native Arrays) ออกเป็นชุดงานย่อยแบบ Tracer-Bullet Tickets
- **สิ่งที่ AI นำเสนอ**:
  - เสนอการซอยงานเป็น 3 Vertical Slices:
    1. Ticket 01: Multi-Category & Multi-Author Association and Composite Key Guard Slice (เริ่มได้ทันที)
    2. Ticket 02: Referential Integrity & Cascading Deletion Verification Slice (บล็อกโดย Ticket 01)
    3. Ticket 03: Relational Catalog Querying & Multi-Taxonomy Filtering Slice (บล็อกโดย Ticket 01)
  - สร้างไฟล์ Ticket ทั้ง 3 ฉบับพร้อม Acceptance Criteria ครบถ้วนใน `.scratch/0004-relational-junction-tables/issues/`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ตรวจสอบและยืนยันการแบ่ง Tickets และลำดับ Blocking Edges ทั้งหมด

### รอบที่ 20: Implementation & Test-Driven Development for Spec-0004 (/implement, /tdd)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ลงมือพัฒนาโค้ดตาม Tickets ของ Spec-0004 (Relational Junction Tables Over PostgreSQL JSONB or Native Arrays) ทั้ง 3 Tickets โดยยึดหลัก TDD (Red-Green-Refactor)
- **สิ่งที่ AI นำเสนอ**:
  - พัฒนาโมดูล [src/modules/catalog/catalog.repository.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/modules/catalog/catalog.repository.ts) และ DTO:
    - Ticket 01: เมธอด `assignCategory` และ `assignAuthor` พร้อมระบบป้องกันการจับคู่ซ้ำด้วย Composite Primary Key (`ConflictError`) และ Foreign Key Constraint Checks (`NotFoundError`)
    - Ticket 02: เมธอด `deleteCategory`, `deleteAuthor`, และ `deleteBook` พร้อมตรวจสอบพฤติกรรม `ON DELETE CASCADE` ลบแถวความสัมพันธ์อัตโนมัติโดยไม่ทำลายเอนทิตีที่เกี่ยวข้อง และไม่เกิด Orphaned Records
    - Ticket 03: เมธอด `getBookDetails`, `getBooksByCategory`, และ `getBooksByAuthor` เชื่อมต่อตารางด้วย ANSI SQL `JOIN` ประกอบโครงสร้างข้อมูลระดับ 1NF/3NF อย่างสมบูรณ์โดยไม่ใช้คอลัมน์ JSONB หรือ Text Array
  - เขียนและรันชุดการทดสอบ TDD ทั้ง 14 เคสใหม่ ผ่าน 100% รวมชุดทดสอบของระบบเป็น 72 เคสผ่านฉลุย
  - ตรวจสอบความถูกต้องของ Typecheck (`tsc --noEmit`) 0 errors
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - สั่งเริ่มการอิมพลีเมนต์ตามสเปกและยอมรับผลการตรวจสอบการทำงานทั้งหมด

### รอบที่ 21: Tracer-Bullet Ticket Breakdown for Spec-0005 (/to-tickets)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ย่อยเอกสารข้อกำหนด Spec-0005 (Zero-External-Dependency Digital Asset Delivery Strategy) ออกเป็นชุดงานย่อยแบบ Tracer-Bullet Tickets
- **สิ่งที่ AI นำเสนอ**:
  - เสนอการซอยงานเป็น 3 Vertical Slices:
    1. Ticket 01: Zero-Dependency Local Static Asset Provisioning Slice (เริ่มได้ทันที)
    2. Ticket 02: Gated Digital Fulfillment Route Handler Slice (บล็อกโดย Ticket 01)
    3. Ticket 03: Atomic Telemetry Ingestion & Audit Integration Slice (บล็อกโดย Ticket 02)
  - สร้างไฟล์ Ticket ทั้ง 3 ฉบับพร้อม Acceptance Criteria ครบถ้วนใน `.scratch/0005-asset-delivery/issues/`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ตรวจสอบและยืนยันการแบ่ง Tickets และลำดับ Blocking Edges ทั้งหมด

### รอบที่ 22: Implementation & Test-Driven Development for Spec-0005 (/implement, /tdd)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ลงมือพัฒนาโค้ดตาม Tickets ของ Spec-0005 (Zero-External-Dependency Digital Asset Delivery Strategy) ทั้ง 3 Tickets โดยยึดหลัก TDD (Red-Green-Refactor)
- **สิ่งที่ AI นำเสนอ**:
  - Ticket 01: สร้างไฟล์ PDF จำลองฉบับสมบูรณ์ [public/sample-ebook.pdf](file:///c:/Users/bond/Documents/miniproject-db-e-book/public/sample-ebook.pdf) ตามมาตรฐาน PDF-1.4 และพัฒนาโมดูล [src/modules/fulfillment/asset.service.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/modules/fulfillment/asset.service.ts) มีฟังก์ชัน `getSamplePdfPath`, `getSamplePdfBuffer`, และ `sanitizeDownloadFilename` ทำความสะอาดชื่อไฟล์ ปราศจากอักขระต้องห้ามของ OS และป้องกัน `.pdf.pdf` พร้อมชุดทดสอบ TDD 4 เคสผ่าน 100%
  - Ticket 02 & Ticket 03: พัฒนา Next.js Route Handler [src/app/api/books/download/route.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/api/books/download/route.ts)
    - รองรับการตรวจสอบโทเค็นดาวน์โหลดแบบ Cryptographic Gating: ขาดโทเค็น (400), โทเค็นไม่พบ (404), โทเค็นถูกระงับหรือโควตาหมด (403), โทเค็นหมดอายุ (410)
    - บันทึก Telemetry และอัปเดตโควตาแบบอะตอมิก: เพิ่ม `download_count` ใน `download_tokens` และเพิ่มบันทึกใน `download_logs` พร้อมข้อมูล IP Address (`x-forwarded-for`) และ User-Agent
    - สตรีมไฟล์ PDF แท้จริงพร้อม Header `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="..."`, และ `Cache-Control: no-store, private`
    - เขียนและรันชุดทดสอบ TDD [src/app/api/books/download/route.test.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/api/books/download/route.test.ts) 7 เคสผ่านฉลุย
  - ตรวจสอบความถูกต้องของ Typecheck (`tsc --noEmit`) 0 errors และชุดทดสอบระบบทั้งหมดรวม 83/83 เคสผ่าน 100%
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - สั่งเริ่มการอิมพลีเมนต์ตามสเปกและยอมรับผลการตรวจสอบการทำงานทั้งหมด

### รอบที่ 23: Tracer-Bullet Ticket Breakdown for Spec-0006 (/to-tickets)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ย่อยเอกสารข้อกำหนด Spec-0006 (Database-Backed Cart Persistence Over Client-Side LocalStorage) ออกเป็นชุดงานย่อยแบบ Tracer-Bullet Tickets
- **สิ่งที่ AI นำเสนอ**:
  - เสนอการซอยงานเป็น 3 Vertical Slices:
    1. Ticket 01: Cart Lifecycle & Digital Idempotency Slice (เริ่มได้ทันที)
    2. Ticket 02: Referential Integrity & Cart Deletion Cascade Slice (บล็อกโดย Ticket 01)
    3. Ticket 03: Atomic Cart-to-Order Checkout & Price Snapshot Slice (บล็อกโดย Ticket 01)
  - สร้างไฟล์ Ticket ทั้ง 3 ฉบับพร้อม Acceptance Criteria ครบถ้วนใน `.scratch/0006-database-backed-cart-persistence/issues/`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ตรวจสอบและยืนยันการแบ่ง Tickets และลำดับ Blocking Edges ทั้งหมด

### รอบที่ 24: Implementation & Test-Driven Development for Spec-0006 (/implement, /tdd)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ลงมือพัฒนาโค้ดตาม Tickets ของ Spec-0006 (Database-Backed Cart Persistence Over Client-Side LocalStorage) ทั้ง 3 Tickets โดยยึดหลัก TDD (Red-Green-Refactor)
- **สิ่งที่ AI นำเสนอ**:
  - สร้างโมดูล [src/modules/cart/cart.dto.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/modules/cart/cart.dto.ts) และ [src/modules/cart/cart.repository.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/modules/cart/cart.repository.ts):
    - Ticket 01: เพิ่ม `getOrCreateCart`, `addItem` พร้อมระบบ Digital Idempotency (`UNIQUE (cart_id, book_id)`), `removeItem`, และ `getCartWithItems` ดึงรายการตะกร้าพร้อมราคาปัจจุบัน คำนวณ Subtotal แม่นยำ
    - Ticket 02: เพิ่ม `deleteUserCascade` และ `deleteBookCascade` พิสูจน์พฤติกรรม `ON DELETE CASCADE` ของตาราง `carts` และ `cart_items` พร้อมเมธอด `getActiveCartDemandStats` สำหรับวัดปริมาณความต้องการสินค้าที่ค้างในตะกร้า
    - Ticket 03: เพิ่ม `checkout` ดำเนินการย้ายสินค้าจาก `cart_items` ไปยัง `order_items` พร้อมตรึงราคาขายจริง (Frozen Price Snapshot) สร้างเรคอร์ดคำสั่งซื้อ `orders` สถานะ `PENDING` พร้อม Public UUID `order_number` คำนวณคูปองส่วนลด และล้างตะกร้าแบบ Atomic Transaction
  - เขียนและรันชุดทดสอบ TDD [src/modules/cart/cart.repository.test.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/modules/cart/cart.repository.test.ts) ทั้ง 15 เคสผ่าน 100%
  - ตรวจสอบความถูกต้องของ Typecheck (`tsc --noEmit`) 0 errors และชุดทดสอบระบบทั้งหมดรวม 98/98 เคสผ่านฉลุย
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - สั่งเริ่มการอิมพลีเมนต์ตามสเปกและยอมรับผลการตรวจสอบการทำงานทั้งหมด

### รอบที่ 25: Tracer-Bullet Ticket Breakdown for Spec-0007 (/to-tickets)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ย่อยเอกสารข้อกำหนด Spec-0007 (Next.js App Router Architecture with Direct Neon SQL Execution) ออกเป็นชุดงานย่อยแบบ Tracer-Bullet Tickets
- **สิ่งที่ AI นำเสนอ**:
  - เสนอการซอยงานเป็น 3 Vertical Slices:
    1. Ticket 01: Lightweight Cookie Session, Role Guards & Demo Account Switcher Slice (เริ่มได้ทันที)
    2. Ticket 02: Customer Shopping Journey & Server Actions Slice (บล็อกโดย Ticket 01)
    3. Ticket 03: Admin Verification Queue & 5D SQL Analytics Dashboard Slice (บล็อกโดย Ticket 01)
  - สร้างไฟล์ Ticket ทั้ง 3 ฉบับพร้อม Acceptance Criteria ครบถ้วนใน `.scratch/0007-nextjs-app-router-and-neon-sql/issues/`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ตรวจสอบและยืนยันการแบ่ง Tickets และลำดับ Blocking Edges ทั้งหมด

### รอบที่ 26: Implementation & Test-Driven Development for Spec-0007 (/implement, /tdd)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ลงมือพัฒนาโค้ดตาม Tickets ของ Spec-0007 (Next.js App Router Architecture with Direct Neon SQL Execution) ทั้ง 3 Tickets โดยยึดหลัก TDD (Red-Green-Refactor)
- **สิ่งที่ AI นำเสนอ**:
  - Ticket 01: พัฒนาระบบ Session Auth แบบ Cookie ด้วย HMAC-SHA256 [src/lib/session.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/lib/session.ts) พร้อมคอมโพเนนต์ Demo Account Switcher [src/components/DemoSwitcher.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/components/DemoSwitcher.tsx) และ [src/components/Navbar.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/components/Navbar.tsx) ให้สลับระหว่าง Somchai (Customer) และ Admin ได้ในคลิกเดียว พร้อมชุดทดสอบ TDD [src/lib/session.test.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/lib/session.test.ts) ผ่าน 7/7 เคส
  - Ticket 02: พัฒนา Customer Journey ด้วย React Server Components (RSC) และ Server Actions:
    - หน้าหลักแคตตาล็อก [src/app/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/page.tsx) รองรับตัวกรองหมวดหมู่และการค้นหา
    - หน้ารายละเอียด [src/app/books/[id]/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/books/[id]/page.tsx) พร้อมปุ่มเพิ่มลงตะกร้าและทดลองอ่าน
    - หน้าตะกร้าสินค้า [src/app/cart/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/cart/page.tsx) รองรับการลบหนังสือ ใส่โค้ดคูปอง และ Checkout
    - หน้าชำระเงิน [src/app/orders/[order_number]/pay/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/orders/[order_number]/pay/page.tsx) แสดง PromptPay QR และฟอร์มส่งสลิปโอนเงิน
    - หน้าคลังหนังสือ [src/app/library/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/library/page.tsx) แสดง e-Book ที่ซื้อแล้วพร้อมปุ่มดาวน์โหลด PDF
  - Ticket 03: พัฒนา Administrator Operations Center & BI Analytics Dashboard:
    - ตัวคุ้มครองสิทธิ์ [src/app/admin/layout.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/admin/layout.tsx) ตรวจสอบบทบาทแอดมินก่อนเข้าถึง
    - คิวตรวจสอบสลิป [src/app/admin/orders/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/admin/orders/page.tsx) อนุมัติ/ปฏิเสธสลิปโอนเงิน
    - ระบบจัดการแคตตาล็อก [src/app/admin/books/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/admin/books/page.tsx) เพิ่มหนังสือ แก้ไขราคา และเปิด/ปิดการขาย
    - แดชบอร์ดวิเคราะห์ 5 มิติ [src/app/admin/analytics/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/admin/analytics/page.tsx) แสดงสถิติและผลลัพธ์ของ SQL Window Functions & CTEs ทั้ง 5 มิติ
  - ตรวจสอบความถูกต้องของ Typecheck (`tsc --noEmit`) 0 errors, ชุดทดสอบระบบทั้งหมดรวม 105/105 เคสผ่านฉลุย (`vitest run`), และคอมไพล์ผ่านฉลุยสมบูรณ์แบบทั้งระบบด้วย `next build` (รองรับ Server Components ด้วย `export const dynamic = 'force-dynamic'` ทั้ง 8 core views)
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - สั่งเริ่มการอิมพลีเมนต์ตามสเปกและยอมรับผลการตรวจสอบการทำงานทั้งหมด

### รอบที่ 27: Neon Serverless PostgreSQL Provisioning, Schema Migration & Vercel Deployment Setup
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ดำเนินการสร้างฐานข้อมูล Neon PostgreSQL จริงบนคลาวด์ รัน Schema Migration และ Data Seeding พร้อมเตรียมความพร้อมสำหรับการ Deploy บน Vercel
- **สิ่งที่ AI นำเสนอ**:
  - Provision โปรเจกต์ Neon PostgreSQL ใหม่ (`miniproject-db-e-book`) ภูมิภาค `aws-ap-southeast-1` (Singapore) อัตโนมัติผ่าน Neon MCP
  - พัฒนาสคริปต์ [src/db/migrate-and-seed.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/db/migrate-and-seed.ts) เพื่อรัน [src/db/schema.sql](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/db/schema.sql) และ Mock ข้อมูลเริ่มต้นครบทุกตาราง (Users, Books, Junctions, Orders, Payments, Download Tokens)
  - ทดสอบเชื่อมต่อและ Query ข้อมูลจริงจาก Next.js Server Components พบว่าตอบกลับ 200 OK ทุกเส้นทาง (`/`, `/admin/analytics`)
  - จัดเตรียม [.env.example](file:///c:/Users/bond/Documents/miniproject-db-e-book/.env.example) และ Push โค้ดทั้งหมดขึ้น GitHub Main Branch พร้อมสำหรับการเชื่อมต่อ Vercel
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - เลือกให้ AI ดำเนินการสร้าง Neon Project อัตโนมัติ และสั่งเตรียมขั้นตอนการเชื่อมต่อ Vercel

### รอบที่ 28: Resolving Catalog Duplicate Keys and Browser Extension Hydration Mismatches
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: แก้ไข Error 2 จุด: (1) `Encountered two children with the same key, '5'` ในหน้าแคตตาล็อก และ (2) React Hydration Mismatch เกิดจากคลาส `keychainify-checked` ที่ Browser Extension ฉีดใส่แท็ก `<a>`
- **สิ่งที่ AI นำเสนอ**:
  - แก้ไข Error 1 ใน [src/app/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/page.tsx): ปรับ SQL Query โดยเปลี่ยนจากการ `LEFT JOIN` แบบธรรมดาซึ่งทำให้หนังสือที่มีหลายหมวดหมู่/หลายผู้แต่งเกิดแถวซ้ำ มาเป็น `GROUP BY b.id` พร้อมใช้ `STRING_AGG(DISTINCT c.name, ', ')` และ `EXISTS` สำหรับตัวกรอง ทำให้ผลลัพธ์หนังสือแต่ละเล่มมีแถวเดียวเสมอ และคีย์ React `key={book.id}` ไม่ซ้ำกันอีกต่อไป
  - แก้ไข Error 2 ใน [src/app/layout.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/layout.tsx), [src/components/Navbar.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/components/Navbar.tsx), และ [src/app/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/page.tsx): เพิ่ม `suppressHydrationWarning` บน `<html>`, `<body>`, และแท็ก `<Link>`/`<a>` เพื่อป้องกันไม่ให้ React ฟ้อง Mismatch เมื่อ Browser Extension (เช่น ส่วนขยายจัดการรหัสผ่าน Keychainify / 1Password) ฉีดคลาสหรือ Attribute ลงบน DOM ก่อน React ทำ Hydration
  - ผ่านการทดสอบ Vitest 105/105 เคส, TypeScript 0 errors, และ `next build` ผ่านฉลุย พร้อม Push ขึ้น GitHub
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - รายงาน Error ทั้ง 2 จุดและยอมรับแนวทางการแก้ไขทางสถาปัตยกรรมของ AI

### รอบที่ 29: Resolving Webpack Runtime TypeError & Server Component Cookie Restrictions
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: แก้ไข Runtime TypeError: `__webpack_modules__[moduleId] is not a function`
- **สิ่งที่ AI นำเสนอ**:
  - วิเคราะห์สาเหตุหลัก 2 ประการ:
    1. มีการเรียกใช้ `setSessionCookie()` โดยตรงใน Server Components ([src/app/cart/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/cart/page.tsx) และ [src/app/library/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/library/page.tsx)) ซึ่งขัดต่อข้อกำหนดของ Next.js App Router (ไม่อนุญาตให้แก้ไข Cookie ระหว่าง Render Server Component) ทำให้ SSR Crash และพ่น Error สู่ Webpack Client Stream
    2. มีการประกาศฟังก์ชัน `async () => { 'use server'; ... }` แบบ Anonymous Inline Closure ภายใน Loop `.map()` ทำให้ Webpack Bundler ไม่สามารถ Resolve Module ID ของ Server Actions ได้อย่างถูกต้อง
  - การแก้ไข:
    1. ปรับปรุง [src/app/cart/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/cart/page.tsx) และ [src/app/library/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/library/page.tsx) ให้ใช้ Fallback In-memory User (`DEMO_USERS.customer`) โดยไม่เรียก Mutate Cookie ในฝั่ง Read Component
    2. ปรับปรุง Server Actions ทั้งหมดใน [src/app/actions/cart.actions.ts](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/actions/cart.actions.ts) ให้รองรับการ Bind พารามิเตอร์ (`.bind(null, id)`) และ FormData โดยตรง ลบ Inline `'use server'` ในคอมโพเนนต์ออกทั้งหมด
    3. เคลียร์ Stale Cache ใน `.next` และ Restart Dev Server ใหม่
  - ผลลัพธ์: ทุก Route (`/`, `/cart`, `/library`, `/books/[id]`, `/orders/[order_number]/pay`, `/admin/*`) ตอบกลับ 200 OK ราบรื่น ไม่พบ Webpack TypeError ใดๆ
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - แจ้งรายงานบั๊ก Runtime TypeError และยอมรับการปรับปรุงโครงสร้าง Server Actions ของ AI

### รอบที่ 30: Fixing Users Table Column Reference in Admin Verification Queue
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: แก้ไข Error `Runtime AppError: column u.name does not exist` ในหน้า [src/app/admin/orders/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/admin/orders/page.tsx)
- **สิ่งที่ AI นำเสนอ**:
  - ตรวจสอบโครงสร้างตาราง `users` ใน [src/db/schema.sql](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/db/schema.sql) พบว่าชื่อคอลัมน์ที่แท้จริงคือ `full_name` ไม่ใช่ `name`
  - แก้ไข SQL Query ใน [src/app/admin/orders/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/admin/orders/page.tsx) จาก `u.name AS user_name` เป็น `u.full_name AS user_name`
  - ทดสอบ Query บนฐานข้อมูล Neon จริง พบรายการคำสั่งซื้อค้างตรวจ 3 รายการพร้อมชื่อสมชาย ใจดี ถูกต้องสมบูรณ์
  - ทดสอบยิง Request หน้า `/admin/orders` ด้วย Session Cookie แอดมิน พบสถานะตอบกลับ 200 OK
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - แจ้ง Error และยอมรับการแก้ไขชื่อคอลัมน์ให้ตรงกับ 3NF Relational Schema

### รอบที่ 31: Resolving Admin Orders Duplicate Key & Admin Layout Hydration Warnings
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: แก้ไข Error 2 จุด: (1) `Encountered two children with the same key, '1'` ในหน้า [src/app/admin/orders/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/admin/orders/page.tsx) และ (2) React Hydration Mismatch ใน [src/app/admin/layout.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/admin/layout.tsx)
- **สิ่งที่ AI นำเสนอ**:
  - แก้ไข Error 1: ในตารางคิวตรวจสลิป ข้อมูลแต่ละแถวคือรายการชำระเงิน (`payments`) ซึ่ง 1 คำสั่งซื้อ (`order_id`) สามารถมีประวัติการส่งสลิปหรือชำระเงินได้มากกว่า 1 ครั้ง การใช้ `key={order.order_id}` จึงทำให้เกิดคีย์ซ้ำกัน จึงเปลี่ยนมาใช้ Primary Key ของรายการชำระเงินโดยตรงคือ `key={order.payment_id}` ซึ่งไม่ซ้ำกันแน่นอน 100%
  - แก้ไข Error 2: เพิ่ม `suppressHydrationWarning` ให้กับแท็บนำทางแอดมินใน [src/app/admin/layout.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/admin/layout.tsx) และลิงก์ดูสลิปใน [src/app/admin/orders/page.tsx](file:///c:/Users/bond/Documents/miniproject-db-e-book/src/app/admin/orders/page.tsx) ป้องกัน Browser Extension แทรกคลาสบนแท็ก `<a>`
  - ตรวจสอบผ่านการทดสอบ 105/105 tests, TypeScript 0 errors, Commit และ Push ขึ้น GitHub เรียบร้อย
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - รายงาน Error และยอมรับการแก้ไข

### รอบที่ 32: Requirements Grilling, Domain Modeling & Architectural Decision for Spec-0008 (/grill-with-docs)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: สัมภาษณ์และเจาะลึก 3 ฟีเจอร์ใหม่: (1) อัปโหลดไฟล์สลิปเป็นรูปภาพ, (2) ตัวเลข Badge แจ้งเตือนสินค้าในตะกร้า, และ (3) ระบบ Login/Register สำหรับลูกค้าทั่วไปที่ทำงานร่วมกับ Demo Persona Switcher
- **สิ่งที่ AI นำเสนอ**:
  - วิเคราะห์และสัมภาษณ์โจทย์ผ่านกระบวนการ `/grill-with-docs` (Grilling + Domain Modeling)
  - กำหนดการจัดเก็บรูปสลิปด้วย Base64 Data URL ลงคอลัมน์ `payments.slip_image_url` ใน Neon PostgreSQL โดยตรง เพื่อรักษาหลักการ 100% Zero-Dependency บน Vercel Serverless
  - กำหนดการแสดงผล Cart Badge ด้วยการนับจำนวน `cart_items` ผ่าน RSC Revalidation
  - ออกแบบระบบ Authenticated Customer Portal (`/login`, `/register`) ร่วมกับการเข้ารหัสรหัสผ่านด้วย `crypto.scrypt` โดยยังคงรักษาปุ่มสลับบัญชีแบบ 1 คลิกใน Demo Persona Switcher สำหรับให้อาจารย์ตรวจงานได้อย่างสะดวก
  - จัดทำเอกสารสถาปัตยกรรม [docs/adr/0008-base64-slip-upload-cart-badge-and-auth-portal.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/adr/0008-base64-slip-upload-cart-badge-and-auth-portal.md), อัปเดตพจนานุกรมศัพท์ [GLOSSARY.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/GLOSSARY.md), และจัดทำข้อกำหนดทางเทคนิค [docs/specs/0008-base64-slip-upload-cart-badge-and-auth-portal.md](file:///c:/Users/bond/Documents/miniproject-db-e-book/docs/specs/0008-base64-slip-upload-cart-badge-and-auth-portal.md)
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ยืนยันแนวทางการออกแบบตามข้อเสนอแนะของ AI ครบทุกข้อ

### รอบที่ 33: Tracer-Bullet Ticket Breakdown for Spec-0008 (/to-tickets)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ย่อยเอกสารข้อกำหนด Spec-0008 (Base64 Slip Image Storage, Reactive Cart Badge, and Self-Contained Auth Portal) ออกเป็นชุดงานย่อยแบบ Tracer-Bullet Tickets
- **สิ่งที่ AI นำเสนอ**:
  - เสนอการแบ่งงานเป็น 3 Vertical Slices ที่เป็นอิสระต่อกัน:
    1. Ticket 01: Reactive Cart Item Badge in Navigation Header Slice (เริ่มได้ทันที)
    2. Ticket 02: Interactive Base64 Slip File Upload & Admin Verification Preview Slice (เริ่มได้ทันที)
    3. Ticket 03: Customer Registration, Cryptographic Password Hashing & Login Portal Slice (เริ่มได้ทันที)
  - จัดทำไฟล์ Ticket ทั้ง 3 ฉบับพร้อมเกณฑ์การยอมรับ (Acceptance Criteria) ลงในไดเรกทอรี `.scratch/0008-base64-slip-upload-cart-badge-and-auth-portal/issues/`
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ตรวจสอบและให้ความเห็นชอบกับการแบ่ง Tickets ทั้ง 3 ใบ

### รอบที่ 34: Implementation of Spec-0008 Tickets (/implement)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ดำเนินการพัฒนาระบบตาม Tracer-Bullet Tickets ทั้งหมดใน `.scratch/0008-base64-slip-upload-cart-badge-and-auth-portal`
- **สิ่งที่ AI สร้างและดำเนินการ**:
  1. **Ticket 01 (Reactive Cart Badge)**:
     - พัฒนาการแสดงผลจำนวนชิ้นสินค้าที่ไม่ซ้ำ (`cart_items`) บนไอคอนตะกร้าใน Navbar (`src/components/Navbar.tsx`)
     - ผูก Server Actions (`addToCartAction`, `removeFromCartAction`, `checkoutAction`) ให้เรียก `revalidatePath('/', 'layout')` เพื่อให้ Cart Badge อัปเดตทันที
  2. **Ticket 02 (Interactive Base64 Slip Upload & Admin Preview)**:
     - พัฒนาคอมโพเนนต์ `SlipUploader.tsx` สำหรับ `/orders/[order_number]/pay` รองรับการเลือกไฟล์ PNG/JPEG/WebP ตรวจสอบขนาดไม่เกิน 2MB แสดงพรีวิวภาพสด และแปลงเป็น Base64 Data URL สำหรับส่งเข้า Server Action
     - พัฒนาคอมโพเนนต์ `SlipPreviewModal.tsx` ในหน้าคิวตรวจสอบของผู้ดูแลระบบ (`/admin/orders`) แสดงภาพ Thumbnail สลิปพร้อมระบบ Modal ขยายดูภาพสลิปจริงขนาดใหญ่
     - กำหนด `serverActions: { bodySizeLimit: '5mb' }` ใน `next.config.js` เพื่อรองรับ Payload ขนาดใหญ่ของรูปภาพสลิปแบบ Base64
  3. **Ticket 03 (Customer Registration, scrypt Password Hashing & Login Portal)**:
     - สร้างยูทิลิตี้เข้ารหัสและตรวจสอบรหัสผ่าน `src/lib/password.ts` ด้วย Node.js `crypto.scrypt` พร้อม Salt สุ่ม 16 ไบต์ และ Constant-Time Comparison (`timingSafeEqual`)
     - พัฒนาโมดูล `UserRepository` ใน `src/modules/users/user.repository.ts`
     - สร้าง Server Actions `registerAction` และ `loginAction` ใน `src/app/actions/auth.actions.ts` ป้องกันอีเมลซ้ำและออก Session Cookie อัตโนมัติ
     - พัฒนาหน้าจอ `/register` และ `/login` พร้อมระบบ Quick-Fill บัญชีทดสอบสำหรับให้อาจารย์และผู้ตรวจงานทดสอบได้สะดวกรวดเร็ว
     - เพิ่มลิงก์เข้าสู่ระบบและสมัครสมาชิกในแถบ Demo Persona Switcher (`src/components/DemoSwitcher.tsx`)
     - เขียนชุดทดสอบครอบคลุม 121/121 การทดสอบในระบบ ผ่านฉลุย 100% พร้อมทดสอบ `tsc --noEmit` และ `next build` สำเร็จเรียบร้อย
### รอบที่ 35: Comprehensive Frontend Redesign (/redesign-existing-projects & /grill-me)
- **วันที่**: 2026-10-02
- **โจทย์ที่ป้อนให้ AI**: ยกเครื่องดีไซน์หน้าบ้าน (Frontend Redesign) ของระบบร้านขาย E-Book ทั้งหมด ให้สวยงาม พรีเมียม ทันสมัยตามมาตรฐานระดับสูง ไม่ดูเป็นเทมเพลตสำเร็จรูป
- **กระบวนการทำงานร่วมกับ AI**:
  - ดำเนินการสัมภาษณ์ความต้องการ (Interactive Interview / Grill-me) ใน 6 ประเด็นหลัก และได้ข้อสรุปร่วมกัน:
    1. Visual Style: Minimalist Clean & Bento Grid (เน้นเส้นขอบ Hairline คมชัด พื้นผิวแบบ Layered Flat Surface ไม่ใช้ Gradient หรือ Drop Shadow หนาเตอะ)
    2. Redesign Scope: ครอบคลุมทั้งระบบ (Demo Switcher Ribbon, Glassmorphic Navbar, Catalog Hero & Book Cards, Book Detail, Cart & Checkout, Library, Auth Pages, และ Admin Portal)
    3. Hero Section: Asymmetric Bento Hero (ฝั่งซ้าย: Headline ตัวหนา ค้นหาหนังสือ และสถิติสถาปัตยกรรมระบบ 3 เสาหลัก, ฝั่งขวา: การ์ด Staff Pick รายสัปดาห์ และแท็กหมวดหมู่ยอดนิยม)
    4. Book Cards: Elevated Minimalist Bento Card พร้อม Category Pill, Tabular-nums Pricing, และ Quick Add to Cart
    5. Navigation: รวม Demo Persona Switcher เป็น Dark Ribbon กะทัดรัด คมชัด และ Navbar แบบ Frosted Glassmorphism
    6. Typography & Data: ใช้แบบอักษร Google Fonts `Geist` + `Geist Mono` + `Sarabun` พร้อม `font-mono tabular-nums` สำหรับตัวเลขและราคาทั้งระบบ
- **สิ่งที่ AI สร้างและปรับปรุง**:
  - ปรับแต่ง `tailwind.config.js` และ `src/app/globals.css` สำหรับระบบ Design Tokens (Fonts, Bento Surfaces, Glass Nav, Tabular Nums)
  - ปรับปรุง `src/components/DemoSwitcher.tsx` และ `src/components/Navbar.tsx` เป็น Header ทันสมัยระดับพรีเมียม
  - ยกระดับ `src/app/page.tsx` เป็น Asymmetric Bento Hero และแคตตาล็อกหนังสือ
  - ออกแบบใหม่สำหรับหน้าหนังสือ `src/app/books/[id]/page.tsx`, ตะกร้าสินค้า `src/app/cart/page.tsx`, คลังหนังสือดิจิทัล `src/app/library/page.tsx`, การชำระเงินและอัปโหลดสลิป `src/app/orders/[order_number]/pay/page.tsx` และ `src/components/SlipUploader.tsx`
  - ยกระดับหน้าจอความปลอดภัย `src/app/login/page.tsx`, `src/app/register/page.tsx`, และ `src/components/SlipPreviewModal.tsx`
  - ตกแต่งหน้าจอผู้ดูแลระบบ `src/app/admin/layout.tsx`, `src/app/admin/orders/page.tsx`, `src/app/admin/books/page.tsx`, และแดชบอร์ดสถิติ 5 มิติ `src/app/admin/analytics/page.tsx`
  - ป้องกันปัญหา Hydration Warning จาก Browser Extension ด้วย `suppressHydrationWarning` บนลิงก์และปุ่มทั้งหมด
  - ผ่านการตรวจสอบ TypeScript `tsc --noEmit` 0 errors, ชุดทดสอบ `vitest` ผ่าน 121/121 tests, และ `next build` ผ่าน 100%
- **การตัดสินใจของมนุษย์ (Human Decision)**:
  - ให้ความเห็นชอบกับแนวทางการออกแบบทั้งหมด และสั่งการให้เริ่มดำเนินการจนเสร็จสมบูรณ์


