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
  if (!user) return Response.json({ success: false, error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 });

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
    // HTTP adapter لا يدعم المعاملات — ننفّذ بالتتابع مع تراجع يدوي أدناه،
    // مع الحفاظ على قفل التفاؤلي عبر UPDATE شرطي ذري واحد (بديل updateMany).
    const result = await (async () => {
      const auction = await prisma.auction.findUnique({
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

      // Optimistic-lock guard — atomic conditional UPDATE, statement-for-statement
      // equivalent of the old updateMany WHERE (unsupported over HTTP). Single
      // statement, so a concurrent request still cannot slip between read and
      // write. $executeRaw affected-row count verified (1 on hit, 0 when stale).
      const affected = await prisma.$executeRaw`
        UPDATE "auctions"
        SET "currentPrice" = ${parsed.data.amount}
        WHERE "id" = ${auction.id}
          AND "status" = 'ACTIVE'
          AND "endDate" > ${new Date()}
          AND "currentPrice" <= ${parsed.data.amount - auction.minBidIncrement}
      `;

      if (affected !== 1) {
        return { status: 409, message: 'تمت مزايدة أعلى قبل لحظة، حدّث السعر وحاول مجددًا' };
      }

      let bidId: string | null = null;
      try {
        const bid = await prisma.bid.create({
          data: { amount: parsed.data.amount, auctionId: id, userId: user.id },
        });
        bidId = bid.id;

        // Anti-sniping: a bid in the last 2 minutes extends the auction by 2 minutes.
        const SNIPING_WINDOW_MS = 2 * 60 * 1000;
        let extended = false;
        if (auction.endDate.getTime() - Date.now() < SNIPING_WINDOW_MS) {
          await prisma.auction.update({
            where: { id },
            data: { endDate: new Date(Date.now() + SNIPING_WINDOW_MS) },
          });
          extended = true;
        }

        return { status: 201, bid, previousTopBidderId: auction.bids[0]?.userId, extended };
      } catch (writeErr) {
        // Manual rollback of the price bump (was the tx's job): remove our bid
        // and restore the previous price — but only if no newer bid already
        // moved it (never clobber a concurrent higher bid).
        if (bidId) await prisma.bid.delete({ where: { id: bidId } }).catch(() => {});
        await prisma.$executeRaw`
          UPDATE "auctions"
          SET "currentPrice" = ${auction.currentPrice}
          WHERE "id" = ${auction.id} AND "currentPrice" = ${parsed.data.amount}
        `.catch(() => {});
        throw writeErr;
      }
    })();

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
