import { describe, it, expect, beforeEach } from 'vitest';
import { CatalogRepository } from './catalog.repository';
import { DatabaseExecutor, setDatabaseExecutor } from '@/db/client';
import { ConflictError, NotFoundError } from '@/lib/errors';

class MockCatalogDatabaseExecutor implements DatabaseExecutor {
  public booksTable: any[] = [
    {
      id: 1,
      title: 'Designing Data-Intensive Applications',
      subtitle: 'The Big Ideas Behind Reliable, Scalable, and Maintainable Systems',
      isbn: '978-1449373320',
      publisher_id: 10,
      price: 650.0,
      discount_price: 590.0,
      cover_image_url: 'https://example.com/ddia.jpg',
      sample_file_url: null,
      file_format: 'PDF',
      file_size_bytes: 25000000,
      page_count: 616,
      publication_date: '2017-03-16',
      is_active: true,
    },
    {
      id: 2,
      title: 'Database Internals',
      subtitle: 'A Deep Dive into How Distributed Data Systems Work',
      isbn: '978-1492040347',
      publisher_id: 10,
      price: 890.0,
      discount_price: null,
      cover_image_url: 'https://example.com/dbi.jpg',
      sample_file_url: null,
      file_format: 'PDF',
      file_size_bytes: 18000000,
      page_count: 370,
      publication_date: '2019-10-15',
      is_active: true,
    },
  ];

  public publishersTable: any[] = [
    { id: 10, name: "O'Reilly Media" },
  ];

  public categoriesTable: any[] = [
    { id: 100, name: 'Computer Science', slug: 'computer-science' },
    { id: 101, name: 'Databases', slug: 'databases' },
    { id: 102, name: 'Distributed Systems', slug: 'distributed-systems' },
  ];

  public authorsTable: any[] = [
    { id: 200, name: 'Martin Kleppmann', bio: 'Researcher in distributed systems' },
    { id: 201, name: 'Alex Petrov', bio: 'Apache Cassandra committer' },
  ];

  public bookCategoriesTable: any[] = [];
  public bookAuthorsTable: any[] = [];

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    const trimmed = queryText.trim();

    // 1. Insert into book_categories
    if (trimmed.startsWith('INSERT INTO book_categories')) {
      const bookId = params[0];
      const categoryId = params[1];

      // Check foreign keys
      const bookExists = this.booksTable.some((b) => String(b.id) === String(bookId));
      const categoryExists = this.categoriesTable.some((c) => String(c.id) === String(categoryId));
      if (!bookExists || !categoryExists) {
        const error: any = new Error('Foreign key violation in book_categories');
        error.code = '23503';
        throw error;
      }

      // Check composite primary key (book_id, category_id)
      const duplicate = this.bookCategoriesTable.some(
        (bc) => String(bc.book_id) === String(bookId) && String(bc.category_id) === String(categoryId)
      );
      if (duplicate) {
        const error: any = new Error('Duplicate key violates composite primary key in book_categories');
        error.code = '23505';
        throw error;
      }

      const row = { book_id: bookId, category_id: categoryId };
      this.bookCategoriesTable.push(row);
      return [row] as unknown as T[];
    }

    // 2. Insert into book_authors
    if (trimmed.startsWith('INSERT INTO book_authors')) {
      const bookId = params[0];
      const authorId = params[1];
      const role = params[2] || 'main_author';

      // Check foreign keys
      const bookExists = this.booksTable.some((b) => String(b.id) === String(bookId));
      const authorExists = this.authorsTable.some((a) => String(a.id) === String(authorId));
      if (!bookExists || !authorExists) {
        const error: any = new Error('Foreign key violation in book_authors');
        error.code = '23503';
        throw error;
      }

      // Check composite primary key (book_id, author_id)
      const duplicate = this.bookAuthorsTable.some(
        (ba) => String(ba.book_id) === String(bookId) && String(ba.author_id) === String(authorId)
      );
      if (duplicate) {
        const error: any = new Error('Duplicate key violates composite primary key in book_authors');
        error.code = '23505';
        throw error;
      }

      const row = { book_id: bookId, author_id: authorId, author_role: role };
      this.bookAuthorsTable.push(row);
      return [row] as unknown as T[];
    }

    // 3. Delete Category (simulating ON DELETE CASCADE)
    if (trimmed.startsWith('DELETE FROM categories WHERE id = $1')) {
      const catId = params[0];
      this.categoriesTable = this.categoriesTable.filter((c) => String(c.id) !== String(catId));
      // Cascade delete from junction
      this.bookCategoriesTable = this.bookCategoriesTable.filter((bc) => String(bc.category_id) !== String(catId));
      return [{ id: catId }] as unknown as T[];
    }

    // 4. Delete Author (simulating ON DELETE CASCADE)
    if (trimmed.startsWith('DELETE FROM authors WHERE id = $1')) {
      const authId = params[0];
      this.authorsTable = this.authorsTable.filter((a) => String(a.id) !== String(authId));
      // Cascade delete from junction
      this.bookAuthorsTable = this.bookAuthorsTable.filter((ba) => String(ba.author_id) !== String(authId));
      return [{ id: authId }] as unknown as T[];
    }

    // 5. Delete Book (simulating ON DELETE CASCADE)
    if (trimmed.startsWith('DELETE FROM books WHERE id = $1')) {
      const bookId = params[0];
      this.booksTable = this.booksTable.filter((b) => String(b.id) !== String(bookId));
      // Cascade delete from both junctions
      this.bookCategoriesTable = this.bookCategoriesTable.filter((bc) => String(bc.book_id) !== String(bookId));
      this.bookAuthorsTable = this.bookAuthorsTable.filter((ba) => String(ba.book_id) !== String(bookId));
      return [{ id: bookId }] as unknown as T[];
    }

    // 6. Query book details by ID
    if (trimmed.includes('FROM books b') && trimmed.includes('WHERE b.id = $1')) {
      const book = this.booksTable.find((b) => String(b.id) === String(params[0]));
      if (!book) return [] as T[];
      const pub = this.publishersTable.find((p) => String(p.id) === String(book.publisher_id));
      return [{ ...book, publisher_name: pub ? pub.name : null }] as unknown as T[];
    }

    // 7. Query book categories for book_id
    if (trimmed.includes('FROM book_categories bc') && trimmed.includes('WHERE bc.book_id = $1')) {
      const rows = this.bookCategoriesTable
        .filter((bc) => String(bc.book_id) === String(params[0]))
        .map((bc) => {
          const cat = this.categoriesTable.find((c) => String(c.id) === String(bc.category_id));
          return {
            category_id: bc.category_id,
            category_name: cat?.name || '',
            category_slug: cat?.slug || '',
          };
        });
      return rows as unknown as T[];
    }

    // 8. Query book authors for book_id
    if (trimmed.includes('FROM book_authors ba') && trimmed.includes('WHERE ba.book_id = $1')) {
      const rows = this.bookAuthorsTable
        .filter((ba) => String(ba.book_id) === String(params[0]))
        .map((ba) => {
          const auth = this.authorsTable.find((a) => String(a.id) === String(ba.author_id));
          return {
            author_id: ba.author_id,
            author_name: auth?.name || '',
            author_role: ba.author_role,
          };
        });
      return rows as unknown as T[];
    }

    // 9. Query books by category_id
    if (trimmed.includes('WHERE bc.category_id = $1')) {
      const bookIds = this.bookCategoriesTable
        .filter((bc) => String(bc.category_id) === String(params[0]))
        .map((bc) => bc.book_id);
      const books = this.booksTable.filter((b) => bookIds.includes(b.id));
      return books as unknown as T[];
    }

    // 10. Query books by author_id
    if (trimmed.includes('WHERE ba.author_id = $1')) {
      const bookIds = this.bookAuthorsTable
        .filter((ba) => String(ba.author_id) === String(params[0]))
        .map((ba) => ba.book_id);
      const books = this.booksTable.filter((b) => bookIds.includes(b.id));
      return books as unknown as T[];
    }

    return [] as T[];
  }
}

describe('Relational Junction Tables Over JSONB / Native Arrays (Spec 0004)', () => {
  let mockDb: MockCatalogDatabaseExecutor;
  let catalogRepo: CatalogRepository;

  beforeEach(() => {
    mockDb = new MockCatalogDatabaseExecutor();
    setDatabaseExecutor(mockDb);
    catalogRepo = new CatalogRepository();
  });

  describe('Ticket 01: Multi-Category & Multi-Author Association and Composite Key Guard', () => {
    it('associates a single book with multiple distinct categories in book_categories', async () => {
      await catalogRepo.assignCategory({ bookId: 1, categoryId: 100 });
      await catalogRepo.assignCategory({ bookId: 1, categoryId: 101 });

      expect(mockDb.bookCategoriesTable.length).toBe(2);
      expect(mockDb.bookCategoriesTable[0]).toEqual({ book_id: 1, category_id: 100 });
      expect(mockDb.bookCategoriesTable[1]).toEqual({ book_id: 1, category_id: 101 });
    });

    it('associates a single book with multiple authors and contribution roles in book_authors', async () => {
      await catalogRepo.assignAuthor({ bookId: 1, authorId: 200, authorRole: 'main_author' });
      await catalogRepo.assignAuthor({ bookId: 1, authorId: 201, authorRole: 'co_author' });

      expect(mockDb.bookAuthorsTable.length).toBe(2);
      expect(mockDb.bookAuthorsTable[0]).toEqual({ book_id: 1, author_id: 200, author_role: 'main_author' });
      expect(mockDb.bookAuthorsTable[1]).toEqual({ book_id: 1, author_id: 201, author_role: 'co_author' });
    });

    it('defaults author_role to main_author if not explicitly provided', async () => {
      await catalogRepo.assignAuthor({ bookId: 2, authorId: 201 });
      expect(mockDb.bookAuthorsTable[0].author_role).toBe('main_author');
    });

    it('enforces composite primary key on book_categories and rejects duplicate pairing with ConflictError', async () => {
      await catalogRepo.assignCategory({ bookId: 1, categoryId: 100 });

      await expect(
        catalogRepo.assignCategory({ bookId: 1, categoryId: 100 })
      ).rejects.toThrow(ConflictError);
    });

    it('enforces composite primary key on book_authors and rejects duplicate pairing with ConflictError', async () => {
      await catalogRepo.assignAuthor({ bookId: 1, authorId: 200 });

      await expect(
        catalogRepo.assignAuthor({ bookId: 1, authorId: 200 })
      ).rejects.toThrow(ConflictError);
    });

    it('rejects association referencing non-existent book_id or category_id with NotFoundError', async () => {
      await expect(
        catalogRepo.assignCategory({ bookId: 9999, categoryId: 100 })
      ).rejects.toThrow(NotFoundError);

      await expect(
        catalogRepo.assignCategory({ bookId: 1, categoryId: 9999 })
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects association referencing non-existent author_id with NotFoundError', async () => {
      await expect(
        catalogRepo.assignAuthor({ bookId: 1, authorId: 9999 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Ticket 02: Referential Integrity & Cascading Deletions', () => {
    beforeEach(async () => {
      // Seed links for book 1
      await catalogRepo.assignCategory({ bookId: 1, categoryId: 100 });
      await catalogRepo.assignCategory({ bookId: 1, categoryId: 101 });
      await catalogRepo.assignAuthor({ bookId: 1, authorId: 200 });
    });

    it('deleting a Category cascades to remove junction entries while preserving the Book', async () => {
      await catalogRepo.deleteCategory(100);

      // Category 100 removed from junction
      expect(mockDb.bookCategoriesTable.length).toBe(1);
      expect(mockDb.bookCategoriesTable[0].category_id).toBe(101);

      // Book 1 is completely intact
      expect(mockDb.booksTable.some((b) => b.id === 1)).toBe(true);
    });

    it('deleting an Author cascades to remove junction entries while preserving the Book', async () => {
      await catalogRepo.deleteAuthor(200);

      // Author 200 removed from junction
      expect(mockDb.bookAuthorsTable.length).toBe(0);

      // Book 1 is completely intact
      expect(mockDb.booksTable.some((b) => b.id === 1)).toBe(true);
    });

    it('deleting a Book cascades to remove junction entries while preserving Categories and Authors', async () => {
      await catalogRepo.deleteBook(1);

      // Both junction tables cleaned up
      expect(mockDb.bookCategoriesTable.length).toBe(0);
      expect(mockDb.bookAuthorsTable.length).toBe(0);

      // Categories and Authors are still in database
      expect(mockDb.categoriesTable.length).toBe(3);
      expect(mockDb.authorsTable.length).toBe(2);
    });
  });

  describe('Ticket 03: Relational Catalog Querying & Filtering', () => {
    beforeEach(async () => {
      // Link book 1 to 2 categories and 1 author
      await catalogRepo.assignCategory({ bookId: 1, categoryId: 100 });
      await catalogRepo.assignCategory({ bookId: 1, categoryId: 101 });
      await catalogRepo.assignAuthor({ bookId: 1, authorId: 200, authorRole: 'main_author' });

      // Link book 2 to 1 category and 1 author
      await catalogRepo.assignCategory({ bookId: 2, categoryId: 101 });
      await catalogRepo.assignAuthor({ bookId: 2, authorId: 201, authorRole: 'main_author' });
    });

    it('getBookDetails retrieves complete entity including categories and authors via relational joins', async () => {
      const book = await catalogRepo.getBookDetails(1);

      expect(book).not.toBeNull();
      expect(book?.id).toBe(1);
      expect(book?.title).toBe('Designing Data-Intensive Applications');
      expect(book?.publisherName).toBe("O'Reilly Media");
      expect(book?.categories.length).toBe(2);
      expect(book?.categories.map((c) => c.categoryName)).toEqual(['Computer Science', 'Databases']);
      expect(book?.authors.length).toBe(1);
      expect(book?.authors[0].authorName).toBe('Martin Kleppmann');
      expect(book?.authors[0].authorRole).toBe('main_author');
    });

    it('getBookDetails returns null for non-existent book', async () => {
      const book = await catalogRepo.getBookDetails(9999);
      expect(book).toBeNull();
    });

    it('getBooksByCategory filters catalog by category using relational joins', async () => {
      // Category 101 (Databases) has both book 1 and book 2
      const databaseBooks = await catalogRepo.getBooksByCategory(101);
      expect(databaseBooks.length).toBe(2);

      // Category 100 (Computer Science) has only book 1
      const csBooks = await catalogRepo.getBooksByCategory(100);
      expect(csBooks.length).toBe(1);
      expect(csBooks[0].id).toBe(1);
    });

    it('getBooksByAuthor filters catalog by author using relational joins', async () => {
      const martinBooks = await catalogRepo.getBooksByAuthor(200);
      expect(martinBooks.length).toBe(1);
      expect(martinBooks[0].title).toBe('Designing Data-Intensive Applications');

      const alexBooks = await catalogRepo.getBooksByAuthor(201);
      expect(alexBooks.length).toBe(1);
      expect(alexBooks[0].title).toBe('Database Internals');
    });
  });
});
