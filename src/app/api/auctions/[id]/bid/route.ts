import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { z } from 'zod';

const bidSchema = z.object({
  amount: z.number().positive().finite(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Reversible kill-switch: set AUCTIONS_ENABLED=false to freeze bidding
  // without deleting code or data. Reads stay visible.
  if (process.env.AUCTIONS_ENABLED === 'false') {
    return Response.json({ error: 'المزادات متوقفة مؤقتًا' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bidSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'المبلغ يجب أن يكون رقمًا صحيحًا' }, { status: 422 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id },
        include: { bids: { orderBy: { amount: 'desc' }, take: 1 } },
      });
      if (!auction) return { status: 404, message: 'المزاد غير موجود' };
      if (auction.status !== 'ACTIVE') return { status: 400, message: 'المزاد منتهي' };
      if (auction.sellerId === user.id) return { status: 400, message: 'لا يمكنك المزايدة على سيارتك' };
      if (auction.endDate < new Date()) return { status: 400, message: 'انتهى وقت المزاد' };

      const minimumAmount = auction.currentPrice + auction.minBidIncrement;
      if (parsed.data.amount < minimumAmount) {
        return { status: 400, message: `المبلغ يجب أن يكون على الأقل ${minimumAmount} د.أ` };
      }

      const updatedAuction = await tx.auction.updateMany({
        where: {
          id,
          status: 'ACTIVE',
          endDate: { gt: new Date() },
          currentPrice: { lte: parsed.data.amount - auction.minBidIncrement },
        },
        data: { currentPrice: parsed.data.amount },
      });

      if (updatedAuction.count !== 1) {
        return { status: 409, message: 'تمت مزايدة أعلى قبل لحظة، حدّث السعر وحاول مجددًا' };
      }

      const bid = await tx.bid.create({
        data: { amount: parsed.data.amount, auctionId: id, userId: user.id },
      });

      // Anti-sniping: a bid in the last 2 minutes extends the auction by 2 minutes.
      const SNIPING_WINDOW_MS = 2 * 60 * 1000;
      let extended = false;
      if (auction.endDate.getTime() - Date.now() < SNIPING_WINDOW_MS) {
        await tx.auction.update({
          where: { id },
          data: { endDate: new Date(Date.now() + SNIPING_WINDOW_MS) },
        });
        extended = true;
      }

      return { status: 201, bid, previousTopBidderId: auction.bids[0]?.userId, extended };
    });

    if (result.status !== 201) {
      return Response.json({ error: result.message }, { status: result.status });
    }

    if (result.previousTopBidderId && result.previousTopBidderId !== user.id) {
      await prisma.notification.create({
        data: {
          type: 'BID_OUTBID',
          title: 'تم تجاوز مزايدتك',
          message: `تم تجاوز مزايدتك في مزاد ${id.slice(0, 8)} بمبلغ ${parsed.data.amount} د.أ`,
          userId: result.previousTopBidderId,
          link: `/cars/${id}`,
        },
      }).catch(() => {});
    }

    return Response.json({ success: true, data: result.bid, extended: result.extended === true }, { status: 201 });
  } catch (error) {
    console.error('Bid error:', error);
    return Response.json({ error: 'فشل تسجيل المزايدة' }, { status: 500 });
  }
}
