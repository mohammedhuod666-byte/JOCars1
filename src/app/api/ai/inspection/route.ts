import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { chatCompletionJSON, type ChatMessage } from '@/ai/nvidia-client';
import { successResponse, errorResponse } from '@/lib/api';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/* ═══════════════════════════════════════════════════════════════════
   AI Inspection Analyzer — Jordan market chassis & mechanical expert.
   1) Arabic normalization + fuzzy matching → tolerates misspellings.
   2) Local expert engine (always works): per-system scoring.
   3) Live LLM layer (GPT OSS 20B + failovers): deep verdict; falls
      back to the local engine when the API is unreachable.
   ═══════════════════════════════════════════════════════════════════ */

// ── 1) Normalization (misspelling tolerance) ─────────────────────────
export function normalizeAr(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/(.)\1{2,}/g, '$1$1') // collapse 3+ repeats (جيددد → جيدد)
    .replace(/[\u200c\u200d]/g, '')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** word-boundary test shared by exact + fuzzy matching */
function boundaryRe(term: string): RegExp | null {
  try {
    const AR = '\\u0600-\\u06FF';
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^${AR}])([وبلفك]ال|ال|[وبلفك])?${esc}([^${AR}]|$)`);
  } catch {
    return null;
  }
}

/** true if any token of the text fuzzy-matches the term (typo-tolerant) */
function fuzzyHas(text: string, term: string): boolean {
  const normTerm = normalizeAr(term);
  if (!normTerm) return false;
  // Exact match ALWAYS respects Arabic word boundaries — otherwise short
  // terms like 'قص' fire inside 'قصعات', and 'دقه' inside unrelated words.
  const clean = text.replace(/[ً-ٰٟ]/g, '');
  const exact = boundaryRe(normTerm);
  if (exact && exact.test(clean)) return true;
  // Fuzzy (1 typo) only for terms of 5+ chars — short terms must be exact,
  // otherwise 'جيد' matches '7 جيد' and 'الجير' matches 'تجميد'.
  if (normTerm.length < 5) return false;
  const tokens = clean.split(/[\s،,.;:()\[\]{}"'-]+/).filter((t) => t.length >= 4);
  return tokens.some((tok) => {
    if (Math.abs(tok.length - normTerm.length) > 1) return false;
    return levenshtein(tok, normTerm) <= 1;
  });
}

// ── 2) Expert knowledge base ─────────────────────────────────────────
type Severity = 'info' | 'minor' | 'major' | 'critical';

interface TermRule {
  terms: string[];          // first term = canonical label
  system: SystemId;
  severity: Severity;
  safetyHit: number;        // points subtracted from 100
  discount: number;         // % price impact
  note: string;
}

type SystemId =
  | 'chassis' | 'body' | 'glass' | 'engine' | 'gearbox'
  | 'electrical' | 'ac' | 'brakes' | 'suspension' | 'tires'
  | 'exhaust' | 'hybrid' | 'flood' | 'odometer';

const SYSTEM_NAMES: Record<SystemId, string> = {
  chassis: 'الشاصي والهيكل',
  body: 'البدي والدهان',
  glass: 'الزجاج والأنوار',
  engine: 'المحرك',
  gearbox: 'ناقل الحركة (الجير)',
  electrical: 'الكهرباء',
  ac: 'التكييف',
  brakes: 'الفرامل',
  suspension: 'التعليق والتوجيه',
  tires: 'الإطارات',
  exhaust: 'العادم',
  hybrid: 'الهايبرد والبطارية',
  flood: 'الغرق والحريق',
  odometer: 'العداد والوثائق',
};

const RULES: TermRule[] = [
  // — Chassis: critical —
  { terms: ['مقصوص', 'مقصوصه', 'قص', 'تقطيع'], system: 'chassis', severity: 'critical', safetyHit: 55, discount: 25, note: 'قص بالشاصي — خلل هيكلي جسيم يضعف السيارة بالحوادث' },
  { terms: ['مضروب', 'مضروبه', 'ضربه قويه', 'حادث قوي'], system: 'chassis', severity: 'critical', safetyHit: 45, discount: 22, note: 'ضربة قوية بالشاصي — تتطلب فحص أبعاد (CCM) قبل أي قرار' },
  { terms: ['مشغول', 'ملحوم', 'لحام', 'نقاط لحام'], system: 'chassis', severity: 'critical', safetyHit: 40, discount: 20, note: 'لحام/شغل على الشاصي — علامة إصلاح حادث جسيم سابق' },
  { terms: ['مغير واجهه', 'تغيير واجهه', 'واجهه اماميه', 'رديتر مصدوم'], system: 'chassis', severity: 'major', safetyHit: 25, discount: 12, note: 'تغيير الواجهة الأمامية (حامل الرديتر) — حادث مقدمي متوسط' },
  { terms: ['مقص', 'مقصور', 'قصع', 'انحراف', 'ابعاد'], system: 'chassis', severity: 'major', safetyHit: 30, discount: 15, note: 'اشتباه انحراف/قص — يلزم قياس أبعاد الشاصي الأربعة' },
  // — Chassis: minor (banket) —
  { terms: ['قصعات', 'قصعه', 'ضربه بنكيت', 'دقه بنكيت', 'دقه', 'كحته', 'حكه سفليه', 'مقدع'], system: 'chassis', severity: 'minor', safetyHit: 8, discount: 6, note: 'قصعات/دقة بنكيت أسفل الشاصي — شائعة ولا تمس السلامة غالباً' },
  { terms: ['راسيه', 'راسية', 'ضربه راسيه'], system: 'chassis', severity: 'minor', safetyHit: 6, discount: 4, note: 'ضربة رأسية خفيفة — غالباً سطحية' },
  // — Chassis positives —
  { terms: ['خالي قص', 'خالي العلام', 'خالي ملاحظات', 'شاصي سليم', 'فحص كامل'], system: 'chassis', severity: 'info', safetyHit: 0, discount: 0, note: 'الشاصي خالٍ من القص والملاحظات' },
  { terms: ['7 جيد', 'سبعه جيد', 'فل جيد'], system: 'chassis', severity: 'info', safetyHit: 0, discount: 0, note: 'تقييم سوقي ممتاز (7 جيد)' },
  { terms: ['4 جيد', 'اربعه جيد', 'الشواصي 4 جيد'], system: 'chassis', severity: 'info', safetyHit: -5, discount: 0, note: 'الشواصي الأربعة جيدة' },
  { terms: ['3 جيد'], system: 'chassis', severity: 'minor', safetyHit: 10, discount: 5, note: 'تقييم 3 جيد — توجد ملاحظات متوسطة' },
  // — Body / paint —
  { terms: ['سمكره', 'معجون', 'رش', 'دهان غير اصلي', 'فرق لون'], system: 'body', severity: 'minor', safetyHit: 4, discount: 5, note: 'سمكرة وإعادة دهان — تخفض القيمة السوقية' },
  { terms: ['مقدم مضروب', 'مؤخر مضروب', 'باب مضروب', 'رفرف', 'صدام', 'طبون'], system: 'body', severity: 'major', safetyHit: 12, discount: 8, note: 'ضربات صفائح خارجية — تحقق من امتدادها للشاصي' },
  { terms: ['سقف مصدوم', 'قوائم', 'عمدان', 'شمعات'], system: 'body', severity: 'critical', safetyHit: 35, discount: 18, note: 'ضربة سقف/قوائم — انقلاب أو حادث علوي سابق محتمل' },
  { terms: ['عتبات', 'ارضيه', 'شنطه', 'صندوق خلفي مصدوم'], system: 'body', severity: 'major', safetyHit: 18, discount: 10, note: 'ضربات أرضية/عتبات/صندوق — افحص امتدادها هيكلياً' },
  { terms: ['صدا', 'برومه', 'تآكل'], system: 'body', severity: 'major', safetyHit: 15, discount: 8, note: 'صدأ/برومة — ينتشر ويضعف الهيكل مع الوقت' },
  // — Glass / lights —
  { terms: ['زجاج مغير', 'زجاج امامي مغير', 'فانوس مغير', 'كشاف مغير', 'مرايا مكسوره'], system: 'glass', severity: 'minor', safetyHit: 3, discount: 3, note: 'استبدال زجاج/أنوار — مؤشر حادث سابق غالباً أمامي' },
  // — Engine —
  { terms: ['تبخيره', 'دخان', 'دخنه', 'نقص زيت', 'ياكل زيت'], system: 'engine', severity: 'major', safetyHit: 10, discount: 10, note: 'تبخيرة/دخان/نقص زيت — المحرك قد يحتاج توضيب قريباً' },
  { terms: ['تهريب زيت', 'تسريب زيت', 'ليك'], system: 'engine', severity: 'minor', safetyHit: 5, discount: 4, note: 'تهريب زيت — صيانة جوانات/صوف غالباً' },
  { terms: ['خلط', 'طحينه', 'رغوه زيت', 'حراره', 'يغلي'], system: 'engine', severity: 'critical', safetyHit: 25, discount: 15, note: 'خلط زيت/ماء أو حرارة — تلف رأس المحرك (كازكيت) محتمل' },
  { terms: ['كراسي مكينه', 'رجفه', 'اهتزاز', 'صوت تكايات', 'جنزير'], system: 'engine', severity: 'minor', safetyHit: 5, discount: 4, note: 'رجفة/أصوات محرك — كراسي أو تكايات أو جنزير' },
  { terms: ['كمبريشن ضعيف', 'ضغط سلندر'], system: 'engine', severity: 'major', safetyHit: 12, discount: 10, note: 'ضعف ضغط السلندرات — تآكل داخلي بالمحرك' },
  // — Gearbox —
  { terms: ['نتعه', 'طنجره', 'تاخير غيارات', 'تزحلق', 'يفصل'], system: 'gearbox', severity: 'major', safetyHit: 10, discount: 9, note: 'نتعة/تأخير/تزحلق بالجير — فحص متخصص للطنجرة والبلوف' },
  { terms: ['جير جيد', 'غيارات جيده', 'تبديل ناعم'], system: 'gearbox', severity: 'info', safetyHit: 0, discount: 0, note: 'ناقل الحركة يعمل بسلاسة' },
  { terms: ['زيت جير محروق', 'كلتش', 'دبرياج'], system: 'gearbox', severity: 'minor', safetyHit: 5, discount: 4, note: 'زيت جير محروق أو كلتش — صيانة دورية مطلوبة' },
  // — Electrical —
  { terms: ['دينمو', 'سلف', 'بطاريه 12', 'تهريب كهربا', 'فيوزات', 'ضفيره'], system: 'electrical', severity: 'minor', safetyHit: 4, discount: 3, note: 'ملاحظات كهربائية (دينمو/سلف/ضفيرة) — فحص كمبيوتر موصى به' },
  { terms: ['لمبه ايرباق', 'ايرباق فاتح', 'حساسات'], system: 'electrical', severity: 'major', safetyHit: 20, discount: 8, note: 'لمبة إيرباق/حساسات — خطر سلامة مباشر بعد حادث محتمل' },
  { terms: ['عداد ملعوب', 'ممشى غير حقيقي', 'عداد راجع'], system: 'odometer', severity: 'major', safetyHit: 0, discount: 12, note: 'اشتباه تلاعب بالعداد — تحقق من السجلات والفحص' },
  // — AC —
  { terms: ['كمبريسر', 'غاز مكيف', 'مكيف ضعيف', 'ثلاجه'], system: 'ac', severity: 'minor', safetyHit: 2, discount: 3, note: 'ضعف تكييف (كمبريسر/غاز) — مكلف صيفاً بالأردن' },
  // — Brakes —
  { terms: ['فحمات', 'ديسكات', 'خرخره فرامل', 'ABS', 'دواسه اسفنجيه'], system: 'brakes', severity: 'major', safetyHit: 18, discount: 4, note: 'ملاحظات فرامل — سلامة مباشرة، إصلاح فوري' },
  // — Suspension / steering —
  { terms: ['مساعدات', 'جلد مقصات', 'مقصات', 'رودات', 'بيضات', 'علبة دركسيون', 'طرمبه دركسيون', 'ميزان'], system: 'suspension', severity: 'minor', safetyHit: 6, discount: 4, note: 'استهلاك منظومة التعليق/التوجيه — طبيعي حسب الممشى' },
  { terms: ['حفه', 'يحدف', 'رجه سرعه'], system: 'suspension', severity: 'minor', safetyHit: 6, discount: 3, note: 'حدفة/رجة — ميزانية وترصيص أو جنط مضروب' },
  // — Tires —
  { terms: ['كوشوك تعبان', 'تشققات', 'تاريخ قديم', 'تآكل غير منتظم'], system: 'tires', severity: 'minor', safetyHit: 6, discount: 2, note: 'إطارات مستهلكة — كلفة استبدال قريبة + خطر سلامة' },
  // — Exhaust —
  { terms: ['دبه', 'شكمان مخروم', 'حساس اكسجين', 'دخنه سوده'], system: 'exhaust', severity: 'minor', safetyHit: 3, discount: 3, note: 'ملاحظات عادم/دبة — تؤثر على الفحص البيئي والاستهلاك' },
  // — Hybrid / EV —
  { terms: ['بطاريه ضعيفه', 'خلايا', 'استبدال بطاريه', 'SOH منخفض'], system: 'hybrid', severity: 'critical', safetyHit: 10, discount: 18, note: 'بطارية هايبرد/كهرباء ضعيفة — كلفة استبدال باهظة' },
  { terms: ['مروحه بطاريه', 'تبريد بطاريه', 'انفرتر'], system: 'hybrid', severity: 'major', safetyHit: 8, discount: 8, note: 'تبريد/إنفرتر البطارية — حيوي لعمر المنظومة' },
  { terms: ['بطاريه جيده', 'هايبرد جيد', 'نظام الهايبرد جيد'], system: 'hybrid', severity: 'info', safetyHit: 0, discount: 0, note: 'منظومة الهايبرد/البطارية سليمة' },
  // — Flood / fire —
  { terms: ['غرقان', 'غرق', 'تجميد', 'طين داخل', 'ريحه عفن'], system: 'flood', severity: 'critical', safetyHit: 60, discount: 40, note: 'أضرار غرق — كهرباء وصدأ مخفي، تجنب الشراء' },
  { terms: ['احتراق', 'حروق', 'حريق'], system: 'flood', severity: 'critical', safetyHit: 65, discount: 45, note: 'أضرار حريق — هيكل وكهرباء متضررة، تجنب الشراء' },
];

export interface LocalVerdict {
  grade: string;
  gradeEn: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'AVOID';
  safety: number;
  discount: number;
  interpreted: string[];
  systems: { id: SystemId; name: string; status: 'good' | 'warning' | 'bad' | 'unknown'; score: number; notes: string[] }[];
  issues: { text: string; severity: Severity }[];
  positives: string[];
  summary: string;
  recommendation: string;
}

export function analyzeLocal(rawText: string): LocalVerdict {
  const text = normalizeAr(rawText);
  const matched: { rule: TermRule; term: string }[] = [];

  for (const rule of RULES) {
    const hit = rule.terms.find((t) => fuzzyHas(text, t));
    if (hit) matched.push({ rule, term: rule.terms[0] });
  }

  let safety = 100;
  let discount = 0;
  const issues: { text: string; severity: Severity }[] = [];
  const positives: string[] = [];
  const interpreted: string[] = [];
  const sysNotes = new Map<SystemId, string[]>();
  const sysWorst = new Map<SystemId, Severity>();

  const rank: Record<Severity, number> = { info: 0, minor: 1, major: 2, critical: 3 };

  for (const { rule, term } of matched) {
    interpreted.push(term);
    if (rule.severity === 'info') {
      positives.push(rule.note);
      safety = Math.min(100, safety - rule.safetyHit); // info hits carry 0 or small bonus
    } else {
      safety -= rule.safetyHit;
      discount += rule.discount;
      issues.push({ text: rule.note, severity: rule.severity });
    }
    if (!sysNotes.has(rule.system)) sysNotes.set(rule.system, []);
    sysNotes.get(rule.system)!.push(rule.note);
    const prev = sysWorst.get(rule.system);
    if (!prev || rank[rule.severity] > rank[prev]) sysWorst.set(rule.system, rule.severity);
  }

  safety = Math.max(5, Math.min(100, Math.round(safety)));
  discount = Math.min(60, Math.round(discount));

  const systems = (Object.keys(SYSTEM_NAMES) as SystemId[]).map((id) => {
    const worst = sysWorst.get(id);
    const notes = sysNotes.get(id) || [];
    const status = !worst || worst === 'info' ? (notes.length ? 'good' : 'unknown') : worst === 'minor' ? 'warning' : worst === 'major' ? 'warning' : 'bad';
    const score = !worst ? (notes.length ? 92 : 50) : worst === 'info' ? 95 : worst === 'minor' ? 75 : worst === 'major' ? 55 : 25;
    return { id, name: SYSTEM_NAMES[id], status: status as 'good' | 'warning' | 'bad' | 'unknown', score, notes };
  });

  let grade = 'فحص نظيف — ينصح بها';
  let gradeEn: LocalVerdict['gradeEn'] = 'EXCELLENT';
  if (matched.some((m) => m.rule.system === 'flood')) {
    grade = 'تجنب الشراء — غرق/حريق';
    gradeEn = 'AVOID';
  } else if (safety < 55 || matched.some((m) => m.rule.severity === 'critical')) {
    grade = 'شاصي مضروب — لا ينصح بها';
    gradeEn = 'POOR';
  } else if (safety < 75 || matched.some((m) => m.rule.severity === 'major')) {
    grade = 'ملاحظات متوسطة — تفاوض بقوة';
    gradeEn = 'FAIR';
  } else if (safety < 92 || matched.some((m) => m.rule.severity === 'minor')) {
    grade = 'جيدة مع ملاحظات بسيطة';
    gradeEn = 'GOOD';
  }

  if (issues.length === 0) {
    issues.push({ text: 'لا توجد عيوب هيكلية أو ميكانيكية جوهرية مذكورة في النص المدخل.', severity: 'info' });
  }

  const summary =
    gradeEn === 'EXCELLENT'
      ? 'التقرير المدخل نظيف ولا يحمل إشارات خطر — السيارة مرشحة ممتازة بسعر السوق الكامل.'
      : gradeEn === 'AVOID'
        ? 'التقرير يحمل إشارات غرق أو حريق — هذه أخطر العيوب وأغلاها إصلاحاً. تجنب الشراء تماماً.'
        : `رُصدت ${issues.filter((i) => i.severity !== 'info').length} ملاحظات مؤثرة. الخصم التجاري العادل بالسوق الأردني ≈ ${discount}%.`;

  const recommendation =
    gradeEn === 'EXCELLENT'
      ? 'امضِ بالشراء بعد معاينة سريعة وتأكد من مطابقة الشاصي للرخصة.'
      : gradeEn === 'AVOID'
        ? 'لا تشترِ هذه السيارة بأي سعر — ابحث عن بديل نظيف.'
        : 'افحص النقاط المذكورة عند مركز معتمد (قياس أبعاد عند أي شبهة شاصي) وفاوض على خصم يعادل التقدير أعلاه.';

  return { grade, gradeEn, safety, discount, interpreted, systems, issues, positives, summary, recommendation };
}

// ── 3) Live LLM layer ────────────────────────────────────────────────
interface AIVerdict {
  grade?: string;
  gradeEn?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'AVOID';
  safety?: number;
  discount?: number;
  summary?: string;
  recommendation?: string;
  issues?: { text: string; severity: string }[];
  positives?: string[];
  interpreted?: string[];
  negotiation?: string[];
  confidence?: number;
}

async function analyzeAI(rawText: string, local: LocalVerdict): Promise<{ data: Partial<AIVerdict>; ok: boolean }> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `أنت خبير فحص سيارات أردني (شاصي/بودي/ميكانيك/هايبرد) تفهم اللهجة الأردنية والأخطاء الإملائية. حلل نص كشف الفحص التالي وأجب JSON فقط بهذا الشكل تماماً:
{"grade":"التقييم السوقي بكلمتين","gradeEn":"EXCELLENT|GOOD|FAIR|POOR|AVOID","safety":0-100,"discount":0-60,"summary":"ملخص سطرين","recommendation":"نصيحة الشراء بسطر","issues":[{"text":"...","severity":"minor|major|critical"}],"positives":["..."],"interpreted":["مصطلحات فهمتها من النص"],"negotiation":["نصيحة تفاوض 1","نصيحة تفاوض 2"],"confidence":0-100}
قواعد السوق الأردني: قص/مضروب شاصي = خصم 20-30% وخطر. دقة بنكيت/قصعات = خصم 5-10%. غرق/حريق = تجنب. بطارية هايبرد ضعيفة = خصم 15-20%. 7 جيد = ممتاز.`,
    },
    { role: 'user', content: rawText.slice(0, 2000) },
  ];
  try {
    const res = await Promise.race([
      chatCompletionJSON<AIVerdict>(messages, { maxTokens: 1200, timeoutMs: 20000, retries: 1 }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 22000)),
    ]);
    if (res && typeof res.safety === 'number') return { data: res, ok: true };
    return { data: {}, ok: false };
  } catch {
    return { data: {}, ok: false };
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return errorResponse('تسجيل الدخول مطلوب لاستخدام التحليل الذكي', 401);
  const rateLimit = checkRateLimit(`ai-inspection:${user.id}`, RATE_LIMITS.AI);
  if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح — حاول بعد دقيقة', 429);

  try {
    const body = await request.json().catch(() => ({}));
    const text = String(body.text || '').trim();
    if (text.length < 5) return errorResponse('أدخل نص كشف الفحص أولاً (5 أحرف على الأقل)', 400);
    if (text.length > 4000) return errorResponse('النص طويل جداً (الحد 4000 حرف)', 400);

    const local = analyzeLocal(text);
    const ai = await analyzeAI(text, local);

    if (ai.ok) {
      const d = ai.data;
      const sev = (s: string): Severity => (s === 'critical' ? 'critical' : s === 'major' ? 'major' : s === 'minor' ? 'minor' : 'info');
      return successResponse({
        grade: d.grade || local.grade,
        gradeEn: d.gradeEn || local.gradeEn,
        safety: Math.max(5, Math.min(100, Math.round(d.safety ?? local.safety))),
        discount: Math.max(0, Math.min(60, Math.round(d.discount ?? local.discount))),
        confidence: Math.max(40, Math.min(98, Math.round(d.confidence ?? 85))),
        source: 'ai',
        summary: d.summary || local.summary,
        recommendation: d.recommendation || local.recommendation,
        interpreted: d.interpreted?.length ? d.interpreted : local.interpreted,
        systems: local.systems,
        issues: d.issues?.length ? d.issues.map((i) => ({ text: i.text, severity: sev(i.severity) })) : local.issues,
        positives: d.positives?.length ? d.positives : local.positives,
        negotiation: d.negotiation?.length ? d.negotiation : defaultNegotiation(local),
      });
    }

    // Fallback: local expert engine (works offline / on LLM failure)
    return successResponse({
      grade: local.grade,
      gradeEn: local.gradeEn,
      safety: local.safety,
      discount: local.discount,
      confidence: 70,
      source: 'local',
      summary: local.summary,
      recommendation: local.recommendation,
      interpreted: local.interpreted,
      systems: local.systems,
      issues: local.issues,
      positives: local.positives,
      negotiation: defaultNegotiation(local),
    });
  } catch (error) {
    console.error('AI inspection error:', error);
    return errorResponse('فشل التحليل — حاول مجدداً', 500);
  }
}

function defaultNegotiation(local: LocalVerdict): string[] {
  const tips: string[] = [];
  if (local.gradeEn === 'EXCELLENT') {
    tips.push('السيارة نظيفة — لا تدفع فوق سعر السوق، واطلب فحصاً تأكيدياً سريعاً على حسابك.');
  } else {
    if (local.discount > 0) tips.push(`ابدأ التفاوض بخصم ${local.discount}% مستشهداً بنقاط الفحص المذكورة.`);
    if (local.systems.find((s) => s.id === 'chassis' && (s.status === 'warning' || s.status === 'bad'))) {
      tips.push('اشترط قياس أبعاد الشاصي (CCM) بمركز معتمد قبل دفع أي عربون.');
    }
    if (local.systems.find((s) => s.id === 'hybrid' && s.status !== 'good' && s.status !== 'unknown')) {
      tips.push('اطلب فحص صحة البطارية (SOH) مطبوعاً — استبدال الخلايا مكلف جداً.');
    }
    tips.push('لا تدفع عربوناً قبل المعاينة والفحص التأكيدي بنفسك.');
  }
  return tips.slice(0, 4);
}
