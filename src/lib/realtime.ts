import Ably from 'ably';

/**
 * Server-side Ably helper (Vercel-compatible realtime).
 *
 * The legacy socket.io layer lived in `server.js`, which does not exist on
 * Vercel serverless, so chat events were silently dropped in production.
 * Messages are now published to an Ably channel per conversation
 * (`conversation:<id>`) directly from the API route that persists them.
 *
 * Every call is best-effort: a realtime failure must never break the
 * messaging API itself (the message is already stored at that point).
 */

let restClient: Ably.Rest | null = null;

function getRestClient(): Ably.Rest | null {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;
  if (!restClient) restClient = new Ably.Rest({ key });
  return restClient;
}

export function isRealtimeConfigured(): boolean {
  return Boolean(process.env.ABLY_API_KEY);
}

/**
 * Publish an event to a conversation channel.
 * `name` matches the legacy socket.io event names so clients can subscribe
 * with the same handler names (`message-received`, `user-typing`, ...).
 */
export async function publishConversationEvent(
  conversationId: string,
  name: string,
  data: unknown
): Promise<boolean> {
  if (!conversationId || typeof conversationId !== 'string') return false;
  try {
    const rest = getRestClient();
    if (!rest) {
      console.warn('[realtime] ABLY_API_KEY missing, event dropped:', name);
      return false;
    }
    const channel = rest.channels.get(`conversation:${conversationId}`);
    await channel.publish(name, data);
    return true;
  } catch (error) {
    console.error('[realtime] publish failed:', name, error);
    return false;
  }
}
