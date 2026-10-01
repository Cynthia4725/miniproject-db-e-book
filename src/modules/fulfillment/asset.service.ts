import path from 'path';
import fs from 'fs';
import { NotFoundError } from '@/lib/errors';

export function getSamplePdfPath(): string {
  const filePath = path.resolve(process.cwd(), 'public', 'sample-ebook.pdf');
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('Sample e-book asset file not found at expected location.');
  }
  return filePath;
}

export function getSamplePdfBuffer(): Buffer {
  const filePath = getSamplePdfPath();
  return fs.readFileSync(filePath);
}

export function sanitizeDownloadFilename(title?: string | null): string {
  if (!title || !title.trim()) {
    return 'ebook.pdf';
  }

  let sanitized = title.trim();

  // Strip existing .pdf extension if present
  if (sanitized.toLowerCase().endsWith('.pdf')) {
    sanitized = sanitized.slice(0, -4);
  }

  // Replace invalid characters (/ \ ? % * : | " < >) with underscores or remove them
  sanitized = sanitized
    .replace(/[/\\?%*:|"<>]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

  if (!sanitized) {
    return 'ebook.pdf';
  }

  return `${sanitized}.pdf`;
}
