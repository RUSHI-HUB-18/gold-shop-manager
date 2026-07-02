import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(request: Request) {
  let tempFilePath: string | null = null;
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: 'No logo file provided for upload.' }, { status: 400 });
    }

    // 1. Validate File Mime Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only PNG, JPG, JPEG, SVG, and WEBP images are supported.' }, { status: 400 });
    }

    // 2. Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: 'File size exceeds the 2 MB limit.' }, { status: 400 });
    }

    // Determine extension from mime type
    let ext = 'png';
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') ext = 'jpg';
    else if (file.type === 'image/svg+xml') ext = 'svg';
    else if (file.type === 'image/webp') ext = 'webp';

    const uniqueId = crypto.randomUUID();
    const filename = `shop-logo-${uniqueId}.${ext}`;
    
    // Ensure public/uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Read file bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const finalFilePath = join(uploadsDir, filename);
    tempFilePath = finalFilePath;

    // Write file to server
    await writeFile(finalFilePath, buffer);

    const relativePath = `/uploads/${filename}`;

    // Query existing settings first
    const existing = await prisma.systemSettings.findFirst();
    const previousLogoPath = existing?.shopLogo;

    if (existing) {
      // Update database settings
      await prisma.systemSettings.update({
        where: { id: existing.id },
        data: { shopLogo: relativePath }
      });
    } else {
      // Create new settings row
      await prisma.systemSettings.create({
        data: {
          gstPercentage: 3.0,
          shopName: 'Gold Shop Manager',
          shopLogo: relativePath
        }
      });
    }

    // If database update was successful, delete previous logo file from server if it is not default logo
    if (previousLogoPath && previousLogoPath !== '/uploads/shop-logo.png' && previousLogoPath.startsWith('/uploads/')) {
      const prevFileBasename = previousLogoPath.replace('/uploads/', '');
      const prevFilePath = join(uploadsDir, prevFileBasename);
      try {
        await unlink(prevFilePath);
      } catch (err) {
        console.warn('Failed to delete previous logo file from server storage:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logo uploaded successfully.',
      logoPath: relativePath
    });

  } catch (error: any) {
    console.error('Logo upload error:', error);
    
    // Rollback: If file was written but database transaction fails, remove newly created file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupErr) {
        console.error('Failed to cleanup temp file after database error:', cleanupErr);
      }
    }

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
