import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';

const PHONE_REGEX = /^\+?[0-9\s\-]{8,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export async function GET() {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.systemSettings.findFirst();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      gstPercentage,
      shopName,
      shopAddress = '',
      shopPhone = '',
      shopEmail = '',
      shopWebsite = '',
      shopGstNumber = '',
      shopLogo = '/uploads/shop-logo.png',
      invoiceTerms = '',
      enableQrCode = true,
      currency = 'INR',
      timezone = 'Asia/Kolkata'
    } = body;

    // Server-side Validation checks
    if (!shopName || !shopName.trim()) {
      return NextResponse.json({ success: false, error: 'Shop Name is required.' }, { status: 400 });
    }

    if (gstPercentage === undefined || isNaN(parseFloat(gstPercentage)) || parseFloat(gstPercentage) < 0) {
      return NextResponse.json({ success: false, error: 'A valid GST Percentage >= 0 is required.' }, { status: 400 });
    }

    const trimmedPhone = shopPhone.trim();
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      return NextResponse.json({ success: false, error: 'Invalid Shop Phone Number format.' }, { status: 400 });
    }

    const trimmedEmail = shopEmail.trim();
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid Shop Email format.' }, { status: 400 });
    }

    const trimmedGst = shopGstNumber.trim().toUpperCase();
    if (trimmedGst && !GST_REGEX.test(trimmedGst)) {
      return NextResponse.json({ success: false, error: 'Invalid GSTIN format. Standard Indian GSTIN is 15 alphanumeric characters.' }, { status: 400 });
    }

    // Since there's only one settings record, find the first and update, or create if missing
    const existing = await prisma.systemSettings.findFirst();

    const dataPayload = {
      gstPercentage: parseFloat(gstPercentage),
      shopName: shopName.trim(),
      shopAddress: shopAddress.trim() || null,
      shopPhone: trimmedPhone || null,
      shopEmail: trimmedEmail.toLowerCase() || null,
      shopWebsite: shopWebsite.trim() || null,
      shopGstNumber: trimmedGst || null,
      shopLogo: shopLogo || null,
      invoiceTerms: invoiceTerms.trim() || null,
      enableQrCode: Boolean(enableQrCode),
      currency: currency.trim() || 'INR',
      timezone: timezone.trim() || 'Asia/Kolkata'
    };

    if (existing) {
      const updated = await prisma.systemSettings.update({
        where: { id: existing.id },
        data: dataPayload
      });
      return NextResponse.json({ success: true, message: 'Shop Profile updated successfully.', settings: updated });
    } else {
      const created = await prisma.systemSettings.create({
        data: dataPayload
      });
      return NextResponse.json({ success: true, message: 'Shop Profile initialized.', settings: created });
    }
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update Shop Profile settings.' }, { status: 500 });
  }
}
