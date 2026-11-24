import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request).catch(() => null);

  const auction = await prisma.auction.findFirst({
    where: { OR: [{ carId: id }, { id }] },
    include: {
      bids: {
        orderBy: { amount: 'desc' },
        take: 50,
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      seller: { select: { id: true, name: true } },
      winner: { select: { id: true, name: true } },
      car: {
        select: {
          id: true, slug: true, year: true, price: true, coverImage: true,
          images: { take: 20, orderBy: { order: 'asc' } },
          kilometers: true, fuelType: true, transmission: true, drivetrain: true,
          color: true, doors: true, engineCapacity: true, condition: true, description: true,
          brand: { select: { nameAr: true, nameEn: true } },
          model: { select: { nameAr: true, nameEn: true } },
          city: { select: { nameAr: true } },
          user: { select: { id: true, name: true, dealerName: true, phone: true, whatsapp: true } },
        },
      },
    },
  });

  if (!auction) return Response.json({ success: false, error: 'لا يوجد مزاد' }, { status: 404 });

  if (auction.status === 'ACTIVE' && new Date(auction.endDate) < new Date()) {
    const winner = auction.bids.length > 0 ? auction.bids[0] : null;
    await prisma.auction.update({
      where: { id: auction.id },
      data: { status: 'ENDED', winnerId: winner?.userId || null },
    });
    auction.status = 'ENDED';
    auction.winnerId = winner?.userId || null;
  }

  const myLastBid = user
    ? await prisma.bid.findFirst({
        where: { auctionId: auction.id, userId: user.id },
        orderBy: { amount: 'desc' },
      })
    : null;

  return Response.json({
    success: true,
    data: { ...auction, myLastBid: myLastBid || null },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ success: false, error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 });

  const auction = await prisma.auction.findUnique({ where: { id } });
  if (!auction) return Response.json({ error: 'المزاد غير موجود' }, { status: 404 });
  if (auction.sellerId !== user.id && user.role !== 'ADMIN') return Response.json({ error: 'لا تملك صلاحية' }, { status: 403 });

  const statusSchema = z.object({
    status: z.enum(['ACTIVE', 'ENDED', 'CANCELLED'], { errorMap: () => ({ message: 'حالة المزاد غير صالحة' }) }),
  });
  const parsedBody = statusSchema.safeParse(await request.json());
  if (!parsedBody.success) return Response.json({ success: false, error: 'حالة المزاد غير صالحة' }, { status: 422 });
  const { status } = parsedBody.data;
  const updated = await prisma.auction.update({ where: { id }, data: { status } });

  await createAuditLog({
    action: 'UPDATE_AUCTION', actorId: user.id,
    entityType: 'Auction', entityId: id,
    description: `تعديل المزاد ${id} إلى الحالة ${status}`,
    oldValue: auction.status, newValue: status,
  });

  return Response.json({ success: true, data: updated });
}
