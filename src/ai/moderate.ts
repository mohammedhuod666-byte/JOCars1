import { chatCompletionJSON, type ChatMessage } from './nvidia-client';

export interface ModerationVerdict {
  ok: boolean;
  severity: 'low' | 'medium' | 'high';
  issues: string[];
}

export interface ListingInput {
  brand: string;
  model: string;
  year: number;
  price: number;
  kilometers: number;
  description: string;
  phone: string;
  fuelType: string;
}

/**
 * AI listing pre-moderation for new car ads.
 * 1) Instant local heuristics (no API cost): short description, absurd
 *    price, invalid Jordanian phone.
 * 2) LLM verdict (12s cap): spam / scam / fake-price signals.
 * Never throws — on any failure returns heuristic-only verdict.
 */
export async function moderateListing(input: ListingInput): Promise<ModerationVerdict> {
  const issues: string[] = [];

  const desc = (input.description || '').trim();
  if (desc.length < 15) issues.push('الوصف قصير جداً (أقل من 15 حرفاً)');
  if (!(input.price > 0)) issues.push('سعر غير صالح');
  else if (input.price > 500000) issues.push('سعر مبالغ فيه بشكل غير منطقي');
  const phoneDigits = (input.phone || '').replace(/[^0-9+]/g, '');
  if (!/^(\+?962|0)?7[789]\d{7}$/.test(phoneDigits)) issues.push('رقم الهاتف ليس أردنياً صالحاً');
  if (input.kilometers < 0 || input.kilometers > 1500000) issues.push('عداد كيلومترات غير منطقي');
  if (/(http|www\.|\.com|t\.me|telegram|واتساب.*\d{6,}.*خصم|اربح|جائزة|تحويل.*مقدم)/i.test(desc)) {
    issues.push('الوصف يحتوي روابط أو عبارات تسويقية مشبوهة');
  }

  let severity: ModerationVerdict['severity'] = issues.length >= 2 ? 'medium' : 'low';

  try {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'أنت مدقق إعلانات سيارات في الأردن. اكتشف السبام والاحتيال والأسعار الوهمية. أجب JSON فقط بهذا الشكل: {"spam": false, "scam": false, "reasons": []}',
      },
      {
        role: 'user',
        content: `إعلان: ${input.brand} ${input.model} ${input.year} بسعر ${input.price} د.أ، ممشى ${input.kilometers} كم، وقود ${input.fuelType}. الوصف: ${desc.slice(0, 600)}`,
      },
    ];
    const res = await Promise.race([
      chatCompletionJSON<{ spam?: boolean; scam?: boolean; reasons?: string[] }>(messages, { maxTokens: 300, timeoutMs: 12000, retries: 0 }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 13000)),
    ]);
    if (res && (res.spam || res.scam)) {
      severity = 'high';
      const extra = (res.reasons || ['محتوى مشبوه وفق تحليل الذكاء الاصطناعي']).slice(0, 3);
      issues.push(...extra);
    }
  } catch {
    // LLM unavailable — heuristic verdict stands
  }

  return { ok: severity !== 'high', severity, issues };
}
