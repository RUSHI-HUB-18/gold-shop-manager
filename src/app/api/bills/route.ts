import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';
import { APP_CONFIG } from '@/config/app';

export async function GET(request: Request) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { customerNameSnapshot: { contains: search, mode: 'insensitive' } },
        { customerMobileSnapshot: { contains: search } }
      ];
    }

    if (status === 'DRAFT' || status === 'COMPLETED' || status === 'CANCELLED') {
      whereClause.status = status;
    }

    // Get paginated bills list
    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        customer: { select: { fullName: true, customerCode: true, mobileNumber: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalFiltered = await prisma.bill.count({ where: whereClause });

    // Summary Statistics calculations (for completed/paid calculations)
    const aggregate = await prisma.bill.aggregate({
      where: { status: 'COMPLETED' },
      _sum: {
        total: true,
        gstAmount: true,
        discountAmount: true
      },
      _count: true
    });

    const totalSales = Number(aggregate._sum.total || 0);
    const gstCollected = Number(aggregate._sum.gstAmount || 0);
    const discountAmount = Number(aggregate._sum.discountAmount || 0);
    const count = aggregate._count || 0;

    return NextResponse.json({
      success: true,
      bills,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
      stats: {
        totalSales,
        count,
        gstCollected,
        discountAmount
      }
    });
  } catch (error: any) {
    console.error('Bills GET error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await requireAuthentication();
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userId = authUser.id;
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User profile not found.' }, { status: 400 });
    }
    const createdByName = dbUser.fullName;

    const {
      customerId,
      documentType = 'INVOICE',
      status = 'COMPLETED',
      paymentStatus = 'PAID',
      discountType = 'FLAT',
      discountValue = 0,
      notes = '',
      items = []
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one item is required to generate a bill.' }, { status: 400 });
    }

    // Load configurations snapshot settings
    const [rateData, settingsData] = await Promise.all([
      prisma.goldRate.findFirst({ orderBy: { date: 'desc' } }),
      prisma.systemSettings.findFirst()
    ]);

    if (!rateData) {
      return NextResponse.json({ success: false, error: 'Daily gold rate is not set. Please update the gold rate in settings first.' }, { status: 400 });
    }

    const currentGstPct = settingsData ? settingsData.gstPercentage : 3.0;

    // Load Customer Snapshots if customerId is specified
    let customerNameSnapshot = body.customerNameSnapshot || 'Walk-in Customer';
    let customerMobileSnapshot = body.customerMobileSnapshot || '';
    let customerAddressSnapshot = body.customerAddressSnapshot || '';
    let customerGstSnapshot = body.customerGstSnapshot || '';

    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (customer) {
        customerNameSnapshot = customer.fullName;
        customerMobileSnapshot = customer.mobileNumber;
        customerAddressSnapshot = `${customer.address || ''} ${customer.city || ''} ${customer.state || ''}`.trim();
        customerGstSnapshot = customer.gstNumber || '';
      }
    }

    // Load Shop snapshots (from metadata configuration variables)
    const storeName = APP_CONFIG.NAME;
    const storeAddress = '123, Gold Plaza, Jewel Street';
    const storePhone = '+91 98765 43210';
    const storeGstNumber = '27AAAAA1111A1Z1'; // Snapshot standard store numbers

    // Server-side Recalculation logic
    let grossSubtotal = 0;
    const calculatedItems = [];

    for (const item of items) {
      const quantity = parseInt(item.quantity || '1', 10);
      const grossWeight = parseFloat(item.grossWeight || '0');
      const stoneWeight = parseFloat(item.stoneWeight || '0');
      const netWeight = Math.max(0, grossWeight - stoneWeight);

      const purity = item.purity || '22K';
      const activeGoldRate = purity === '22K' ? rateData.rate22K : (rateData.rate24K || rateData.rate22K);

      const goldValue = netWeight * activeGoldRate;

      // Calculate making charges
      const makingChargeVal = parseFloat(item.makingChargeValue || '0');
      const makingChargeType = item.makingChargeType || 'FLAT';
      let makingChargeAmount = 0;

      if (makingChargeType === 'PERCENTAGE') {
        makingChargeAmount = goldValue * (makingChargeVal / 100);
      } else {
        makingChargeAmount = makingChargeVal * quantity;
      }

      const hallmarkCharge = parseFloat(item.hallmarkCharge || '0');
      const wastagePct = parseFloat(item.wastage || '0');
      const wastageValue = goldValue * (wastagePct / 100);

      const itemSubtotal = goldValue + makingChargeAmount + hallmarkCharge + wastageValue;
      const itemGst = itemSubtotal * (currentGstPct / 100);
      const itemTotal = itemSubtotal + itemGst;

      grossSubtotal += itemSubtotal;

      calculatedItems.push({
        itemId: item.itemId || null,
        itemNameSnapshot: item.itemNameSnapshot || 'Jewellery Item',
        quantity,
        grossWeight,
        stoneWeight,
        netWeight,
        purity,
        goldRate: activeGoldRate,
        makingChargeType,
        makingChargeValue: makingChargeVal,
        makingChargeAmount,
        hallmarkCharge,
        wastage: wastagePct,
        gstPercentage: currentGstPct,
        gstAmount: itemGst,
        amount: itemTotal,
        remarks: item.remarks || ''
      });
    }

    // Overall discount and tax summary recalculations
    const discountValNum = parseFloat(discountValue || '0');
    let discountAmount = 0;
    if (discountType === 'PERCENTAGE') {
      discountAmount = grossSubtotal * (discountValNum / 100);
    } else {
      discountAmount = discountValNum;
    }

    const taxableAmount = Math.max(0, grossSubtotal - discountAmount);
    const totalGst = taxableAmount * (currentGstPct / 100);
    const grandTotal = taxableAmount + totalGst;

    // Retry loop for unique document number generation
    const year = new Date().getFullYear();
    const docPrefix = documentType === 'INVOICE' ? 'INV' : documentType === 'ESTIMATE' ? 'EST' : 'QUO';
    
    let attempts = 0;
    let createdBill = null;
    let lastError = null;

    while (attempts < 5) {
      try {
        const lastBill = await prisma.bill.findFirst({
          where: {
            documentNumber: {
              startsWith: `${docPrefix}-${year}-`
            }
          },
          orderBy: { documentNumber: 'desc' }
        });

        let nextSeq = 1;
        if (lastBill && lastBill.documentNumber) {
          const parts = lastBill.documentNumber.split('-');
          const lastNum = parseInt(parts[2], 10);
          if (!isNaN(lastNum)) {
            nextSeq = lastNum + 1;
          }
        }

        const documentNumber = `${docPrefix}-${year}-${nextSeq.toString().padStart(4, '0')}`;

        createdBill = await prisma.bill.create({
          data: {
            documentNumber,
            documentType,
            customerId: customerId || null,
            userId,
            createdByName,
            invoiceDate: new Date(),
            status,
            paymentStatus,
            subtotal: grossSubtotal,
            discountType,
            discountValue: discountValNum,
            discountAmount,
            taxableAmount,
            gstAmount: totalGst,
            total: grandTotal,
            notes,
            storeName,
            storeAddress,
            storePhone,
            storeGstNumber,
            customerNameSnapshot,
            customerMobileSnapshot,
            customerAddressSnapshot,
            customerGstSnapshot,
            items: {
              create: calculatedItems
            }
          }
        });
        break;
      } catch (dbError: any) {
        lastError = dbError;
        if (dbError.code === 'P2002' && dbError.meta?.target?.includes('documentNumber')) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        throw dbError;
      }
    }

    if (!createdBill) {
      console.error('Failed to generate safe document number:', lastError);
      return NextResponse.json({ success: false, error: 'Failed to assign a unique Document Number. Please retry.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bill created successfully.',
      bill: createdBill
    });

  } catch (error: any) {
    console.error('Bills POST error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
