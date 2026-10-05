/**
 * Canonical app-level enums. The database stores these as plain strings
 * (gradual migration path), so every write path must go through these
 * constants / zod schemas instead of free-form strings.
 */

export const USER_ROLES = ['USER', 'DEALER', 'TRADER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CAR_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SOLD'] as const;
export type CarStatus = (typeof CAR_STATUSES)[number];

export const REPORT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED', 'DISMISSED'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const BOOKING_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const AUCTION_STATUSES = ['ACTIVE', 'ENDED', 'CANCELLED'] as const;
export type AuctionStatus = (typeof AUCTION_STATUSES)[number];

export function isUserRole(v: unknown): v is UserRole {
  return typeof v === 'string' && (USER_ROLES as readonly string[]).includes(v);
}

export function isCarStatus(v: unknown): v is CarStatus {
  return typeof v === 'string' && (CAR_STATUSES as readonly string[]).includes(v);
}
