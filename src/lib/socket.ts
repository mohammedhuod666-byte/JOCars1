'use client';

/**
 * Realtime layer for chat.
 *
 * Historically this wrapped socket.io, whose server only existed in
 * `server.js` (absent on Vercel serverless) and whose client never sent the
 * JWT in the handshake, so the server rejected every connection — realtime
 * was effectively dead everywhere.
 *
 * This module keeps the exact same public surface used by the app
 * (`getSocket().on/off/emit`, `isUserOnline`, `disconnectSocket`) but is
 * backed by Ably:
 *  - auth: JWT sent to POST /api/realtime/token, Ably returns a short-lived
 *    token scoped to `presence:users` + the caller's `conversation:<id>` rooms
 *  - rooms: `emit('join-conversation', id)` subscribes to `conversation:<id>`
 *  - events keep their legacy names: message-received, user-typing,
 *    user-stop-typing, user-online, user-offline, user-status
 *  - `emit('new-message')` is a no-op: the API route now publishes the
 *    persisted message server-side, so every participant (including the
 *    sender's other devices) receives exactly one copy
 */

import { Realtime } from 'ably';
import { useAuth } from '@/hooks/useAuth';

type Handler = (data?: any) => void;

const PRESENCE_CHANNEL = 'presence:users';
const MAX_ROOM_ID = 100;

class RealtimeSocket {
  private handlers = new Map<string, Set<Handler>>();
  private rooms = new Map<string, any>();
  private pendingRooms = new Set<string>();
  private realtime: any = null;
  private userId: string | undefined;
  private knownPresence = new Set<string>();
  private connecting = false;
  private closed = false;

  on(event: string, cb: Handler): this {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(cb);
    this.connect();
    return this;
  }

  off(event: string, cb?: Handler): this {
    if (!cb) this.handlers.delete(event);
    else this.handlers.get(event)?.delete(cb);
    return this;
  }

  register(userId?: string): this {
    if (userId && userId !== this.userId) {
      this.userId = userId;
      this.knownPresence.clear();
    }
    this.connect();
    if (this.realtime && this.userId) this.enterPresence();
    return this;
  }

  emit(event: string, data?: any): this {
    switch (event) {
      case 'register':
        return this.register(typeof data === 'string' ? data : undefined);

      case 'join-conversation': {
        const id = typeof data === 'string' ? data : '';
        if (!id || id.length > MAX_ROOM_ID) break;
        if (this.rooms.has(id) || this.pendingRooms.has(id)) break;
        if (!this.realtime) {
          this.pendingRooms.add(id);
          this.connect();
          break;
        }
        this.joinRoom(id);
        break;
      }

      case 'leave-conversation': {
        const id = typeof data === 'string' ? data : '';
        this.pendingRooms.delete(id);
        const channel = this.rooms.get(id);
        this.rooms.delete(id);
        if (channel && this.realtime) {
          Promise.resolve(channel.unsubscribe()).catch(() => {});
        }
        break;
      }

      case 'typing':
      case 'stop-typing': {
        const conversationId = data?.conversationId;
        if (!conversationId || !this.realtime) break;
        const channel = this.realtime.channels.get(`conversation:${conversationId}`);
        const name = event === 'typing' ? 'user-typing' : 'user-stop-typing';
        const payload = event === 'typing'
          ? { userId: data?.userId || this.userId }
          : {};
        Promise.resolve(channel.publish(name, payload)).catch((error: unknown) =>
          console.warn('[realtime] typing publish failed:', error)
        );
        break;
      }

      case 'check-online': {
        const target = data as string;
        if (!target) break;
        this.connect();
        this.refreshPresence()
          .then((members) => this.dispatch('user-status', { userId: target, online: members.has(target) }))
          .catch(() => this.dispatch('user-status', { userId: target, online: false }));
        break;
      }

      case 'new-message':
        // Persisted messages are published by the API route (server-side),
        // so there is nothing to relay from the sender's client.
        break;

      default:
        break;
    }
    return this;
  }

  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const members = await this.refreshPresence();
      return members.has(userId);
    } catch {
      return false;
    }
  }

  disconnect(): void {
    this.closed = true;
    this.rooms.clear();
    this.pendingRooms.clear();
    if (this.realtime) {
      try {
        this.realtime.close();
      } catch {
        /* ignore */
      }
      this.realtime = null;
    }
    this.handlers.clear();
  }

  // ---------------------------------------------------------------- internals

  private dispatch(event: string, data?: any): void {
    const set = this.handlers.get(event);
    if (!set || set.size === 0) return;
    for (const cb of [...set]) {
      try {
        cb(data);
      } catch (error) {
        console.error('[realtime] handler failed:', event, error);
      }
    }
  }

  private connect(): void {
    if (typeof window === 'undefined' || this.closed || this.realtime || this.connecting) return;
    const token = useAuth.getState().token;
    if (!token) return; // not logged in yet; retried on the next on()/emit()

    this.connecting = true;
    try {
      const realtime = new Realtime({
        authUrl: '/api/realtime/token',
        authMethod: 'POST',
        authHeaders: { Authorization: `Bearer ${token}` },
        autoConnect: true,
      });
      this.realtime = realtime;
      realtime.connection.on('connected', () => {
        this.connecting = false;
        this.handleConnected();
      });
      realtime.connection.on('failed', () => {
        this.connecting = false;
        console.warn('[realtime] connection failed');
      });
      realtime.connection.on('disconnected', () => {
        console.warn('[realtime] disconnected, Ably will retry');
      });
    } catch (error) {
      this.connecting = false;
      console.error('[realtime] connect error:', error);
    }
  }

  private handleConnected(): void {
    if (!this.realtime) return;
    const presence = this.realtime.channels.get(PRESENCE_CHANNEL).presence;
    Promise.resolve(presence.subscribe(() => this.refreshPresence().catch(() => {})))
      .catch((error: unknown) => console.warn('[realtime] presence subscribe failed:', error));

    if (this.userId) this.enterPresence();

    for (const id of [...this.pendingRooms]) {
      this.pendingRooms.delete(id);
      this.joinRoom(id);
    }
  }

  private enterPresence(): void {
    const presence = this.realtime?.channels.get(PRESENCE_CHANNEL).presence;
    if (!presence || !this.userId) return;
    Promise.resolve(presence.enter({ userId: this.userId })).catch((error: unknown) =>
      console.warn('[realtime] presence enter failed:', error)
    );
  }

  private joinRoom(id: string): void {
    if (!this.realtime || this.rooms.has(id)) return;
    const channel = this.realtime.channels.get(`conversation:${id}`);
    this.rooms.set(id, channel);
    Promise.resolve(
      channel.subscribe((msg: any) => {
        if (!msg || typeof msg.name !== 'string') return;
        // Never echo typing/online events back to their author (socket.io
        // used `socket.to(room)` which excluded the sender).
        if (
          (msg.name === 'user-typing' || msg.name === 'user-stop-typing') &&
          msg.data?.userId &&
          msg.data.userId === this.userId
        ) {
          return;
        }
        this.dispatch(msg.name, msg.data);
      })
    ).catch((error: unknown) => {
      this.rooms.delete(id);
      console.warn('[realtime] room subscribe failed:', id, error);
    });
  }

  private async refreshPresence(): Promise<Set<string>> {
    if (!this.realtime) {
      this.connect();
      if (!this.realtime) throw new Error('realtime-not-ready');
    }
    const presence = this.realtime.channels.get(PRESENCE_CHANNEL).presence;
    const members: any[] = await presence.get();
    const current = new Set<string>();
    for (const member of members) {
      const uid = member?.data?.userId;
      if (typeof uid === 'string' && uid) current.add(uid);
    }
    for (const uid of current) {
      if (!this.knownPresence.has(uid) && uid !== this.userId) {
        this.dispatch('user-online', { userId: uid });
      }
    }
    for (const uid of [...this.knownPresence]) {
      if (!current.has(uid) && uid !== this.userId) {
        this.dispatch('user-offline', { userId: uid });
      }
    }
    this.knownPresence = current;
    return current;
  }
}

let socket: RealtimeSocket | null = null;

export function getSocket(userId?: string): RealtimeSocket {
  if (!socket) socket = new RealtimeSocket();
  if (userId) socket.register(userId);
  return socket;
}

export async function isUserOnline(userId: string): Promise<boolean> {
  if (!socket) return false;
  return socket.isUserOnline(userId);
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
