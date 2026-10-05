import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { validationErrorResponse } from '@/lib/api';

const createAuctionSchema = z.object({
  carId: z.string().min(1, 'معرّف السيارة مطلوب'),
  startingPrice: z.coerce.number().positive('السعر المبدئي يجب أن يكون موجباً').finite(),
  endDate: z.coerce.date().refine((d) => d > new Date(), 'تاريخ الانتهاء يجب أن يكون في المستقبل'),
  minBidIncrement: z.coerce.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  if (type === 'all') {
    const auctions = await prisma.auction.findMany({
      where: { status: 'ACTIVE', endDate: { gt: new Date() } },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
      include: {
        car: { select: { id: true, slug: true, year: true, price: true, coverImage: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } } } },
        _count: { select: { bids: true } },
      },
    });
    return Response.json({ success: true, data: auctions, pagination: { page, limit, hasMore: auctions.length === limit } });
  }

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (type === 'seller') {
    const auctions = await prisma.auction.findMany({
      where: { sellerId: user.id },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
      include: {
        car: { select: { id: true, slug: true, year: true, price: true, coverImage: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } } } },
        _count: { select: { bids: true } },
      },
    });
    return Response.json({ success: true, data: auctions, pagination: { page, limit, hasMore: auctions.length === limit } });
  }

  if (type === 'bidder') {
    const auctions = await prisma.auction.findMany({
      where: { bids: { some: { userId: user.id } } },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
      include: {
        car: { select: { id: true, slug: true, year: true, price: true, coverImage: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } } } },
        bids: { where: { userId: user.id }, orderBy: { amount: 'desc' }, take: 1 },
        _count: { select: { bids: true } },
      },
    });
    return Response.json({ success: true, data: auctions, pagination: { page, limit, hasMore: auctions.length === limit } });
  }

  return Response.json({ success: false, error: 'نوع غير صالح' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (process.env.AUCTIONS_ENABLED === 'false') {
    return Response.json({ error: 'المزادات متوقفة مؤقتًا' }, { status: 403 });
  }

  const parsed = createAuctionSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);
  const { carId, startingPrice, endDate, minBidIncrement } = parsed.data;

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) return Response.json({ error: 'السيارة غير موجودة' }, { status: 404 });
  if (car.userId !== user.id) return Response.json({ error: 'لست مالك هذه السيارة' }, { status: 403 });

  const existing = await prisma.auction.findUnique({ where: { carId } });
  if (existing && existing.status === 'ACTIVE') return Response.json({ error: 'يوجد مزاد نشط لهذه السيارة' }, { status: 400 });

  const auction = await prisma.auction.create({
    data: {
      carId, sellerId: user.id,
      startingPrice, currentPrice: startingPrice,
      endDate: new Date(endDate),
      minBidIncrement: minBidIncrement || 10,
    },
  });

  return Response.json({ success: true, data: auction }, { status: 201 });
}
