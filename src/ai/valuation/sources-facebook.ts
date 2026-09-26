/**
 * Facebook Marketplace adapter — DISABLED by design (spec §4).
 * Direct access requires login / defeats CAPTCHA / violates ToS.
 * This adapter exists so the slot is explicit, monitored, and one line
 * away from enabling IF a legal official channel ever appears.
 * Outcome status is always SOURCE_UNAVAILABLE — never fabricated rows.
 */
import type { NormalizedListing, VehicleSpec } from './types';

export const FACEBOOK_STATUS = 'SOURCE_UNAVAILABLE';

export async function collectFacebook(
  _spec: VehicleSpec,
  _timeoutMs: number,
): Promise<NormalizedListing[]> {
  void _spec;
  void _timeoutMs;
  return [];
}
