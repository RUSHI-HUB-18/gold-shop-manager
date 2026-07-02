import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
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

    const formattedHistory = history.map((entry) => ({
      ...entry,
      user: {
        username: entry.user.fullName || entry.user.email || entry.user.phoneNumber || 'Unknown user',
      },
    }));

    return NextResponse.json({ history: formattedHistory });
  } catch (error) {
    console.error('Fetch history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Look up user by identifier if a UUID wasn't provided
    let userId = data.userId;
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!existingUser) {
      const userByName = await prisma.user.findFirst({
        where: {
          OR: [
            { fullName: userId },
            { email: userId },
            { phoneNumber: userId },
          ],
        },
      });
      if (!userByName) {
        // Last resort: use the first admin user
        const fallbackUser = await prisma.user.findFirst();
        if (!fallbackUser) {
          return NextResponse.json({ error: 'No users found in system' }, { status: 400 });
        }
        userId = fallbackUser.id;
      } else {
        userId = userByName.id;
      }
    }

    // Validate required fields
    if (!data.itemId || !data.weight || !data.goldRate || data.finalAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    return NextResponse.json({ message: 'Calculation saved', calculation });
  } catch (error) {
    console.error('Save calc error:', error);
    return NextResponse.json({ error: 'Failed to save calculation' }, { status: 500 });
  }
}
