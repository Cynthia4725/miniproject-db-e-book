import { getDatabaseExecutor } from '@/db/client';
import { PublicLibraryItemDto, UserLibraryItemEntity } from './library.dto';

export class LibraryRepository {
  private db = getDatabaseExecutor();

  async getUserLibrary(userId: number | string): Promise<UserLibraryItemEntity[]> {
    const query = `
      SELECT 
        ul.id AS library_id,
        ul.user_id,
        ul.book_id,
        ul.order_id,
        ul.granted_at,
        b.title,
        b.cover_image_url,
        b.file_format,
        b.file_size_bytes,
        o.order_status
      FROM user_library ul
      JOIN books b ON ul.book_id = b.id
      JOIN orders o ON ul.order_id = o.id
      WHERE ul.user_id = $1 AND o.order_status = 'PAID'
      ORDER BY ul.granted_at DESC;
    `;

    const rows = await this.db.query(query, [userId]);

    return rows.map((row) => ({
      libraryId: row.library_id,
      userId: row.user_id,
      bookId: row.book_id,
      orderId: row.order_id,
      grantedAt: row.granted_at,
      title: row.title,
      coverImageUrl: row.cover_image_url,
      fileFormat: row.file_format,
      fileSizeBytes: Number(row.file_size_bytes),
      orderStatus: row.order_status,
    }));
  }

  toPublicDto(item: UserLibraryItemEntity): PublicLibraryItemDto {
    return {
      bookId: item.bookId,
      title: item.title,
      coverImageUrl: item.coverImageUrl,
      fileFormat: item.fileFormat,
      fileSizeBytes: item.fileSizeBytes,
      grantedAt: item.grantedAt,
    };
  }
}
