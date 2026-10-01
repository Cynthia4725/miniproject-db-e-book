import { NextRequest, NextResponse } from 'next/server';
import { DownloadTokenRepository } from '@/modules/fulfillment/token.repository';
import { getSamplePdfBuffer, sanitizeDownloadFilename } from '@/modules/fulfillment/asset.service';
import { getDatabaseExecutor } from '@/db/client';
import { AppError } from '@/lib/errors';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token || !token.trim()) {
    return NextResponse.json(
      { error: 'Download token is required.' },
      { status: 400 }
    );
  }

  // Extract client telemetry from request headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown Agent';

  try {
    const tokenRepo = new DownloadTokenRepository();
    // Atomic validation, quota check, download_count increment, and download_logs ingestion
    const verification = await tokenRepo.verifyAndConsumeToken(token.trim(), {
      ipAddress,
      userAgent,
    });

    // Query book title for sanitized Content-Disposition filename
    const db = getDatabaseExecutor();
    const books = await db.query<{ id: number | string; title: string }>(
      'SELECT id, title FROM books WHERE id = $1 LIMIT 1;',
      [verification.bookId]
    );

    const bookTitle = books && books.length > 0 ? books[0].title : 'ebook';
    const filename = sanitizeDownloadFilename(bookTitle);

    // Retrieve local static sample PDF asset
    const pdfBuffer = getSamplePdfBuffer();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, private',
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }

    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
