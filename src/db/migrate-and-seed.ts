import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

// Load .env.local if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...v] = trimmed.split('=');
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    }
  } catch (err) {
    console.warn('Could not read .env.local:', err);
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function run() {
  console.log('Connecting to Neon PostgreSQL and applying schema...');
  const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Split schema statements safely
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await sql(statement);
    } catch (err: any) {
      console.warn('Notice executing schema statement:', err?.message || err);
    }
  }
  console.log('Schema migration completed.');

  console.log('Seeding initial data...');

  // 1. Users
  await sql`
    INSERT INTO users (email, password_hash, full_name, phone, role)
    VALUES 
      ('somchai@example.com', 'scrypt_demo_hash_somchai', 'สมชาย ใจดี', '081-234-5678', 'customer'),
      ('admin@ebookstore.com', 'scrypt_demo_hash_admin', 'ผู้ดูแลระบบ ร้านอีบุ๊ก', '089-876-5432', 'admin')
    ON CONFLICT (email) DO NOTHING;
  `;

  // 2. Publishers
  await sql`
    INSERT INTO publishers (name, contact_email)
    VALUES 
      ('O''Reilly Media', 'press@oreilly.com'),
      ('Pragmatic Bookshelf', 'support@pragprog.com'),
      ('Manning Publications', 'support@manning.com')
    ON CONFLICT (name) DO NOTHING;
  `;

  // 3. Authors
  await sql`
    INSERT INTO authors (name, bio)
    VALUES 
      ('Martin Kleppmann', 'Researcher in distributed systems and author of Designing Data-Intensive Applications.'),
      ('Robert C. Martin', 'Uncle Bob - Software crafts consultant and Clean Code champion.'),
      ('Martin Fowler', 'Chief Scientist at Thoughtworks, author of Refactoring.'),
      ('Addy Osmani', 'Engineering Leader at Google Chrome, author of JavaScript Design Patterns.'),
      ('Regina Obe & Leo Hsu', 'PostgreSQL experts and database authors.')
    ON CONFLICT DO NOTHING;
  `;

  // 4. Categories
  await sql`
    INSERT INTO categories (name, slug, description)
    VALUES 
      ('Distributed Systems', 'distributed-systems', 'High performance, replication, and partitioning architectures.'),
      ('Software Architecture', 'software-architecture', 'Design principles, clean patterns, and modular engineering.'),
      ('Web Development', 'web-development', 'Modern JavaScript, TypeScript, and full-stack web applications.'),
      ('Database Systems', 'database-systems', 'Relational theory, SQL optimization, and database internals.')
    ON CONFLICT (name) DO NOTHING;
  `;

  // Fetch IDs
  const pubs = await sql`SELECT id, name FROM publishers`;
  const cats = await sql`SELECT id, slug FROM categories`;
  const auths = await sql`SELECT id, name FROM authors`;

  const pubMap = new Map(pubs.map((p: any) => [p.name, p.id]));
  const catMap = new Map(cats.map((c: any) => [c.slug, c.id]));
  const authMap = new Map(auths.map((a: any) => [a.name, a.id]));

  // 5. Books
  await sql`
    INSERT INTO books (
      title, subtitle, isbn, publisher_id, price, discount_price, 
      cover_image_url, sample_file_url, file_url, file_format, file_size_bytes, page_count, publication_date, is_active
    ) VALUES 
      (
        'Designing Data-Intensive Applications',
        'The Big Ideas Behind Reliable, Scalable, and Maintainable Systems',
        '978-1449373320',
        ${pubMap.get("O'Reilly Media") || null},
        650.00,
        520.00,
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop',
        '/sample-ebook.pdf',
        '/sample-ebook.pdf',
        'PDF',
        4250000,
        616,
        '2017-03-16',
        TRUE
      ),
      (
        'Clean Architecture',
        'A Craftsman''s Guide to Software Structure and Design',
        '978-0134494164',
        ${pubMap.get("Pragmatic Bookshelf") || null},
        590.00,
        490.00,
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop',
        '/sample-ebook.pdf',
        '/sample-ebook.pdf',
        'PDF',
        3800000,
        432,
        '2017-09-20',
        TRUE
      ),
      (
        'Refactoring: Improving the Design of Existing Code',
        'Second Edition with JavaScript Examples',
        '978-0134757599',
        ${pubMap.get("Manning Publications") || null},
        720.00,
        NULL,
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop',
        '/sample-ebook.pdf',
        '/sample-ebook.pdf',
        'PDF',
        5100000,
        448,
        '2018-11-30',
        TRUE
      ),
      (
        'Learning JavaScript Design Patterns',
        'A JavaScript and TypeScript Guide to Modular Architectures',
        '978-1098139872',
        ${pubMap.get("O'Reilly Media") || null},
        450.00,
        360.00,
        'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop',
        '/sample-ebook.pdf',
        '/sample-ebook.pdf',
        'PDF',
        3100000,
        280,
        '2023-08-15',
        TRUE
      ),
      (
        'PostgreSQL: Up and Running',
        'A Practical Guide to the Advanced Open Source Database',
        '978-1491963418',
        ${pubMap.get("O'Reilly Media") || null},
        480.00,
        NULL,
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop',
        '/sample-ebook.pdf',
        '/sample-ebook.pdf',
        'PDF',
        2900000,
        320,
        '2021-02-10',
        TRUE
      )
    ON CONFLICT (isbn) DO NOTHING;
  `;

  // Fetch book IDs
  const books = await sql`SELECT id, title FROM books`;
  const bookMap = new Map(books.map((b: any) => [b.title, b.id]));

  // 6. Junctions: Categories & Authors
  const ddiaId = bookMap.get('Designing Data-Intensive Applications');
  const caId = bookMap.get('Clean Architecture');
  const refId = bookMap.get('Refactoring: Improving the Design of Existing Code');
  const jsId = bookMap.get('Learning JavaScript Design Patterns');
  const pgId = bookMap.get('PostgreSQL: Up and Running');

  if (ddiaId && catMap.get('distributed-systems')) {
    await sql`
      INSERT INTO book_categories (book_id, category_id) VALUES 
        (${ddiaId}, ${catMap.get('distributed-systems')}),
        (${ddiaId}, ${catMap.get('database-systems')})
      ON CONFLICT DO NOTHING;
    `;
    const authorId = authMap.get('Martin Kleppmann');
    if (authorId) {
      await sql`INSERT INTO book_authors (book_id, author_id) VALUES (${ddiaId}, ${authorId}) ON CONFLICT DO NOTHING;`;
    }
  }

  if (caId && catMap.get('software-architecture')) {
    await sql`
      INSERT INTO book_categories (book_id, category_id) VALUES 
        (${caId}, ${catMap.get('software-architecture')})
      ON CONFLICT DO NOTHING;
    `;
    const authorId = authMap.get('Robert C. Martin');
    if (authorId) {
      await sql`INSERT INTO book_authors (book_id, author_id) VALUES (${caId}, ${authorId}) ON CONFLICT DO NOTHING;`;
    }
  }

  if (refId && catMap.get('software-architecture')) {
    await sql`
      INSERT INTO book_categories (book_id, category_id) VALUES 
        (${refId}, ${catMap.get('software-architecture')}),
        (${refId}, ${catMap.get('web-development')})
      ON CONFLICT DO NOTHING;
    `;
    const authorId = authMap.get('Martin Fowler');
    if (authorId) {
      await sql`INSERT INTO book_authors (book_id, author_id) VALUES (${refId}, ${authorId}) ON CONFLICT DO NOTHING;`;
    }
  }

  if (jsId && catMap.get('web-development')) {
    await sql`
      INSERT INTO book_categories (book_id, category_id) VALUES 
        (${jsId}, ${catMap.get('web-development')})
      ON CONFLICT DO NOTHING;
    `;
    const authorId = authMap.get('Addy Osmani');
    if (authorId) {
      await sql`INSERT INTO book_authors (book_id, author_id) VALUES (${jsId}, ${authorId}) ON CONFLICT DO NOTHING;`;
    }
  }

  if (pgId && catMap.get('database-systems')) {
    await sql`
      INSERT INTO book_categories (book_id, category_id) VALUES 
        (${pgId}, ${catMap.get('database-systems')})
      ON CONFLICT DO NOTHING;
    `;
    const authorId = authMap.get('Regina Obe & Leo Hsu');
    if (authorId) {
      await sql`INSERT INTO book_authors (book_id, author_id) VALUES (${pgId}, ${authorId}) ON CONFLICT DO NOTHING;`;
    }
  }

  // 7. Coupons
  await sql`
    INSERT INTO coupons (code, discount_type, discount_value, min_spend, valid_from, valid_to, usage_limit, times_used, is_active)
    VALUES 
      ('WELCOME10', 'PERCENTAGE', 10.00, 300.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '30 days', 500, 12, TRUE),
      ('SAVE50', 'FIXED', 50.00, 500.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', 100, 5, TRUE)
    ON CONFLICT (code) DO NOTHING;
  `;

  // 8. Sample Pending Order & Payment for Admin verification queue demonstration
  const users = await sql`SELECT id, email FROM users WHERE email = 'somchai@example.com'`;
  const somchaiId = users[0]?.id;

  if (somchaiId && ddiaId) {
    const orderNum = 'ORD-DEMO-QUEUE-001';
    await sql`
      INSERT INTO orders (order_number, user_id, subtotal_amount, discount_amount, net_amount, order_status)
      VALUES (${orderNum}, ${somchaiId}, 520.00, 0.00, 520.00, 'PAYMENT_SUBMITTED')
      ON CONFLICT (order_number) DO NOTHING;
    `;
    const orders = await sql`SELECT id FROM orders WHERE order_number = ${orderNum}`;
    const orderId = orders[0]?.id;
    if (orderId) {
      await sql`
        INSERT INTO order_items (order_id, book_id, unit_price)
        VALUES (${orderId}, ${ddiaId}, 520.00)
        ON CONFLICT DO NOTHING;
      `;
      await sql`
        INSERT INTO payments (order_id, payment_method, amount_paid, slip_image_url, transferred_at, status)
        VALUES (${orderId}, 'PROMPTPAY', 520.00, 'https://placehold.co/600x800/png?text=PromptPay+Slip+520+THB', NOW() - INTERVAL '30 minutes', 'PENDING_REVIEW')
        ON CONFLICT DO NOTHING;
      `;
    }

    // Also seed a paid order with library entitlement so Somchai has a book in his library
    const paidOrderNum = 'ORD-PAID-001';
    if (caId) {
      await sql`
        INSERT INTO orders (order_number, user_id, subtotal_amount, discount_amount, net_amount, order_status)
        VALUES (${paidOrderNum}, ${somchaiId}, 490.00, 0.00, 490.00, 'PAID')
        ON CONFLICT (order_number) DO NOTHING;
      `;
      const paidOrders = await sql`SELECT id FROM orders WHERE order_number = ${paidOrderNum}`;
      const paidOrderId = paidOrders[0]?.id;
      if (paidOrderId) {
        await sql`
          INSERT INTO order_items (order_id, book_id, unit_price)
          VALUES (${paidOrderId}, ${caId}, 490.00)
          ON CONFLICT DO NOTHING;
        `;
        await sql`
          INSERT INTO payments (order_id, payment_method, amount_paid, slip_image_url, transferred_at, status, verified_at)
          VALUES (${paidOrderId}, 'PROMPTPAY', 490.00, 'https://placehold.co/600x800/png?text=Approved+Slip', NOW() - INTERVAL '2 days', 'APPROVED', NOW() - INTERVAL '2 days')
          ON CONFLICT DO NOTHING;
        `;
        await sql`
          INSERT INTO user_library (user_id, book_id, order_id)
          VALUES (${somchaiId}, ${caId}, ${paidOrderId})
          ON CONFLICT DO NOTHING;
        `;
        const demoToken = 'demo-token-ca-123456789';
        await sql`
          INSERT INTO download_tokens (token, user_id, book_id, expires_at, max_downloads, download_count)
          VALUES (${demoToken}, ${somchaiId}, ${caId}, NOW() + INTERVAL '24 hours', 5, 1)
          ON CONFLICT (token) DO NOTHING;
        `;
      }
    }
  }

  console.log('Database seeding successfully finished!');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
