import { getDatabaseExecutor, mapDatabaseError } from '@/db/client';
import {
  AssignAuthorInput,
  AssignCategoryInput,
  BookAuthorDto,
  BookCategoryDto,
  BookDetailDto,
} from './catalog.dto';

export class CatalogRepository {
  private db = getDatabaseExecutor();

  /**
   * Ticket 01: Multi-Category Association
   * Uses composite primary key (book_id, category_id)
   */
  async assignCategory(
    input: AssignCategoryInput
  ): Promise<{ bookId: number | string; categoryId: number | string }> {
    try {
      const query = `
        INSERT INTO book_categories (book_id, category_id)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const rows = await this.db.query(query, [input.bookId, input.categoryId]);
      const row = rows[0];
      return {
        bookId: row.book_id,
        categoryId: row.category_id,
      };
    } catch (err) {
      throw mapDatabaseError(err);
    }
  }

  /**
   * Ticket 01: Multi-Author Association with Role
   * Uses composite primary key (book_id, author_id)
   */
  async assignAuthor(
    input: AssignAuthorInput
  ): Promise<{ bookId: number | string; authorId: number | string; authorRole: string }> {
    try {
      const role = input.authorRole || 'main_author';
      const query = `
        INSERT INTO book_authors (book_id, author_id, author_role)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const rows = await this.db.query(query, [input.bookId, input.authorId, role]);
      const row = rows[0];
      return {
        bookId: row.book_id,
        authorId: row.author_id,
        authorRole: row.author_role,
      };
    } catch (err) {
      throw mapDatabaseError(err);
    }
  }


  /**
   * Ticket 02: Delete Category with ON DELETE CASCADE
   */
  async deleteCategory(categoryId: number | string): Promise<boolean> {
    const rows = await this.db.query(
      `DELETE FROM categories WHERE id = $1 RETURNING id;`,
      [categoryId]
    );
    return rows.length > 0;
  }

  /**
   * Ticket 02: Delete Author with ON DELETE CASCADE
   */
  async deleteAuthor(authorId: number | string): Promise<boolean> {
    const rows = await this.db.query(
      `DELETE FROM authors WHERE id = $1 RETURNING id;`,
      [authorId]
    );
    return rows.length > 0;
  }

  /**
   * Ticket 02: Delete Book with ON DELETE CASCADE on both junctions
   */
  async deleteBook(bookId: number | string): Promise<boolean> {
    const rows = await this.db.query(
      `DELETE FROM books WHERE id = $1 RETURNING id;`,
      [bookId]
    );
    return rows.length > 0;
  }

  /**
   * Ticket 03: Relational Query for Book Details (assembled from normalized entities)
   */
  async getBookDetails(bookId: number | string): Promise<BookDetailDto | null> {
    const bookQuery = `
      SELECT b.*, p.name AS publisher_name
      FROM books b
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.id = $1
      LIMIT 1;
    `;
    const bookRows = await this.db.query(bookQuery, [bookId]);
    if (!bookRows || bookRows.length === 0) {
      return null;
    }

    const b = bookRows[0];

    // Fetch categories
    const categoriesQuery = `
      SELECT bc.category_id, c.name AS category_name, c.slug AS category_slug
      FROM book_categories bc
      JOIN categories c ON bc.category_id = c.id
      WHERE bc.book_id = $1
      ORDER BY c.name ASC;
    `;
    const categoryRows = await this.db.query(categoriesQuery, [bookId]);
    const categories: BookCategoryDto[] = categoryRows.map((c) => ({
      categoryId: c.category_id,
      categoryName: c.category_name,
      categorySlug: c.category_slug,
    }));

    // Fetch authors
    const authorsQuery = `
      SELECT ba.author_id, a.name AS author_name, ba.author_role
      FROM book_authors ba
      JOIN authors a ON ba.author_id = a.id
      WHERE ba.book_id = $1
      ORDER BY a.name ASC;
    `;
    const authorRows = await this.db.query(authorsQuery, [bookId]);
    const authors: BookAuthorDto[] = authorRows.map((a) => ({
      authorId: a.author_id,
      authorName: a.author_name,
      authorRole: a.author_role,
    }));

    return {
      id: b.id,
      title: b.title,
      subtitle: b.subtitle ?? null,
      isbn: b.isbn ?? null,
      publisherId: b.publisher_id ?? null,
      publisherName: b.publisher_name ?? null,
      price: Number(b.price),
      discountPrice: b.discount_price !== null ? Number(b.discount_price) : null,
      coverImageUrl: b.cover_image_url,
      sampleFileUrl: b.sample_file_url ?? null,
      fileFormat: b.file_format,
      fileSizeBytes: Number(b.file_size_bytes),
      pageCount: b.page_count ? Number(b.page_count) : null,
      publicationDate: b.publication_date ?? null,
      isActive: Boolean(b.is_active),
      categories,
      authors,
    };
  }

  /**
   * Ticket 03: Filter books by category via junction table
   */
  async getBooksByCategory(categoryId: number | string): Promise<any[]> {
    const query = `
      SELECT b.*
      FROM books b
      JOIN book_categories bc ON b.id = bc.book_id
      WHERE bc.category_id = $1
      ORDER BY b.title ASC;
    `;
    return this.db.query(query, [categoryId]);
  }

  /**
   * Ticket 03: Filter books by author via junction table
   */
  async getBooksByAuthor(authorId: number | string): Promise<any[]> {
    const query = `
      SELECT b.*
      FROM books b
      JOIN book_authors ba ON b.id = ba.book_id
      WHERE ba.author_id = $1
      ORDER BY b.title ASC;
    `;
    return this.db.query(query, [authorId]);
  }
}
