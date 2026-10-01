export interface UserLibraryItemEntity {
  libraryId: number | string;
  userId: number | string;
  bookId: number | string;
  orderId: number | string;
  grantedAt: string | Date;
  title: string;
  coverImageUrl: string;
  fileFormat: string;
  fileSizeBytes: number;
  orderStatus: string;
}

export interface PublicLibraryItemDto {
  bookId: number | string;
  title: string;
  coverImageUrl: string;
  fileFormat: string;
  fileSizeBytes: number;
  grantedAt: string | Date;
}
