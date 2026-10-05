import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recording = await prisma.carSoundRecording.findUnique({
      where: { id },
      select: {
        audioData: true,
        mimeType: true,
        car: {
          select: { status: true, userId: true },
        },
      },
    });

    if (!recording || !recording.audioData) {
      return new Response('Not found', {
        status: 404,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      });
    }

    // The authorization decision and the cache decision must be the SAME
    // decision.
    //
    // This used to be a conditional auth check followed by an unconditional
    // `public, max-age=31536000`, which meant the owner's own playback of an
    // UNAPPROVED recording was also served as publicly cacheable for a year. A
    // shared cache could store it and replay that recording — which captures the
    // seller's own voice — to anyone for a year. Approved recordings are public
    // by definition and immutable, so they keep the long cache; everything that
    // required an authorization check is now explicitly private.
    if (recording.car.status !== 'APPROVED') {
      const user = await authenticateRequest(request);
      if (!user || (user.role !== 'ADMIN' && user.id !== recording.car.userId)) {
        return new Response('Forbidden', {
          status: 403,
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        });
      }

      return new Response(recording.audioData as unknown as BodyInit, {
        headers: {
          'Content-Type': recording.mimeType || 'audio/webm',
          'Cache-Control': 'private, no-store, max-age=0',
          'Vary': 'Authorization, Cookie',
        },
      });
    }

    return new Response(recording.audioData as unknown as BodyInit, {
      headers: {
        'Content-Type': recording.mimeType || 'audio/webm',
        // Public and immutable: an approved listing's audio never changes, and
        // this is the one branch that is identical for every caller.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error streaming audio:', error);
    return new Response('Error', { status: 500 });
  }
}
