import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthentication } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const itemId = searchParams.get('itemId');

    const whereClause: Record<string, string> = {};
    if (userId) whereClause.userId = userId;
    if (itemId) whereClause.itemId = itemId;

    const history = await prisma.calculationHistory.findMany({
      where: whereClause,
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true } },
        item: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const formattedHistory = history.map(h => ({
      ...h,
      user: {
        username: h.user.email || h.user.phoneNumber || h.user.fullName
      }
    }));

    return NextResponse.json({ success: true, history: formattedHistory });
  } catch (error) {
    console.error('Fetch history error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch history', message: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthentication();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const userId = user.id; // Determine user ID strictly from verified JWT

    // Validate required fields
    if (!data.itemId || !data.weight || !data.goldRate || data.finalAmount === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields', message: 'Missing required fields' }, { status: 400 });
    }

    const calculation = await prisma.calculationHistory.create({
      data: {
        userId,
        itemId: data.itemId,
        weight: parseFloat(data.weight),
        purity: data.purity || '22K',
        goldRate: parseFloat(data.goldRate),
        makingCharge: parseFloat(data.makingCharge) || 0,
        gstPercentage: parseFloat(data.gstPercentage) || 3,
        finalAmount: parseFloat(data.finalAmount)
      }
    });

    return NextResponse.json({ success: true, message: 'Calculation saved', calculation });
  } catch (error) {
    console.error('Save calc error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save calculation', message: 'Failed to save calculation' }, { status: 500 });
  }
}
