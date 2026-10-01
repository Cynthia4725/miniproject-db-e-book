import { describe, it, expect } from 'vitest';
import {
  getSamplePdfPath,
  getSamplePdfBuffer,
  sanitizeDownloadFilename,
} from './asset.service';
import fs from 'fs';

describe('Zero-Dependency Local Static Asset Provisioning Slice (Ticket 01)', () => {
  it('locates and verifies the authentic sample PDF asset in public/sample-ebook.pdf', () => {
    const pdfPath = getSamplePdfPath();
    expect(fs.existsSync(pdfPath)).toBe(true);

    const buffer = getSamplePdfBuffer();
    expect(buffer.length).toBeGreaterThan(100);
    // Verifies PDF magic number %PDF-
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('sanitizes book title for HTTP Content-Disposition attachment filename', () => {
    const rawTitle = 'Designing Data-Intensive Applications: The Big Ideas / Scalability';
    const sanitized = sanitizeDownloadFilename(rawTitle);

    expect(sanitized).toBe('Designing_Data-Intensive_Applications_The_Big_Ideas_Scalability.pdf');
    expect(sanitized).not.toContain(':');
    expect(sanitized).not.toContain('/');
    expect(sanitized.endsWith('.pdf')).toBe(true);
  });

  it('preserves clean filenames without adding duplicate .pdf extensions', () => {
    const cleanTitle = 'Database_Internals.pdf';
    const sanitized = sanitizeDownloadFilename(cleanTitle);

    expect(sanitized).toBe('Database_Internals.pdf');
    expect(sanitized).not.toContain('.pdf.pdf');
  });

  it('provides a safe default filename if title is blank or invalid', () => {
    const emptyTitle = '    ';
    const sanitized = sanitizeDownloadFilename(emptyTitle);

    expect(sanitized).toBe('ebook.pdf');
  });
});
