export interface CategoryEntity {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: string | Date;
}

export interface AuthorEntity {
  id: number | string;
  name: string;
  bio?: string | null;
  createdAt?: string | Date;
}

export interface BookCategoryDto {
  categoryId: number | string;
  categoryName: string;
  categorySlug: string;
}

export interface BookAuthorDto {
  authorId: number | string;
  authorName: string;
  authorRole: string;
}

export interface BookDetailDto {
  id: number | string;
  title: string;
  subtitle: string | null;
  isbn: string | null;
  publisherId: number | string | null;
  publisherName: string | null;
  price: number;
  discountPrice: number | null;
  coverImageUrl: string;
  sampleFileUrl: string | null;
  fileFormat: string;
  fileSizeBytes: number;
  pageCount: number | null;
  publicationDate: string | null;
  isActive: boolean;
  categories: BookCategoryDto[];
  authors: BookAuthorDto[];
}

export interface AssignCategoryInput {
  bookId: number | string;
  categoryId: number | string;
}

export interface AssignAuthorInput {
  bookId: number | string;
  authorId: number | string;
  authorRole?: string;
}
