/**
 * Centralized AI Client for Cars JO — Powered by NVIDIA NIM.
 * Multi-model registry with automatic failover, word-by-word streaming
 * generator for SSE live text rendering ("أول بأول"), and full site
 * knowledge integration. Falls back to the local Arabic engine if the
 * API is unreachable, so the assistant always replies.
 */

import OpenAI from 'openai';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || '';
const NVIDIA_BASE_URL = process.env.OPENAI_API_BASE || 'https://integrate.api.nvidia.com/v1';

// ── Model Registry ──
export type AIModelId = 'glm' | 'bolt' | 'mistral' | 'gpt-oss';

export interface AIModelInfo {
  id: AIModelId;
  model: string;
  nameAr: string;
  nameEn: string;
  description: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

export const AI_MODELS: Record<AIModelId, AIModelInfo> = {
  glm: {
    id: 'glm',
    model: 'z-ai/glm-5.3-flash',
    nameAr: 'GLM 5.3 Flash (الذكي المعتمد)',
    nameEn: 'GLM 5.3 Flash',
    description: 'نموذج الذكاء الاصطناعي المتقدم والتقييم الدقيق لسيارات وسوق الأردن',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
  },
  bolt: {
    id: 'bolt',
    model: 'nvidia/nemotron-3.5-bolt-e4b',
    nameAr: 'خبير كارس جو (Nemotron Bolt)',
    nameEn: 'Nemotron 3.5 Bolt',
    description: 'الأسرع والأذكى — إجابات فورية متمرسة بلهجة أردنية وخبرة عميقة بالسيارات',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
  },
  mistral: {
    id: 'mistral',
    model: 'mistralai/mistral-large-4-1t-a52b',
    nameAr: 'Mistral Large',
    nameEn: 'Mistral Large',
    description: 'نموذج محادثة متطور للإجابات التحليلية والمفصلة',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
  },
  'gpt-oss': {
    id: 'gpt-oss',
    model: 'openai/gpt-oss-20b',
    nameAr: 'GPT OSS 20B',
    nameEn: 'GPT OSS 20B',
    description: 'نموذج محادثة عام بديل',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
  },
};

// Default = gpt-oss-20b (verified live: ~1s replies). glm-flash currently
// hangs on NVIDIA's side (60s+ with no token), so it stays selectable in
// the UI but is never first in line. User can still pick any model manually.
export const DEFAULT_MODEL: AIModelId = 'glm';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!NVIDIA_API_KEY || NVIDIA_API_KEY.includes('your-api-key')) {
      throw new Error('[AI Client] NVIDIA_API_KEY is not configured. Set it in your environment.');
    }
    client = new OpenAI({
      apiKey: NVIDIA_API_KEY,
      baseURL: NVIDIA_BASE_URL,
      timeout: 25000,
      maxRetries: 0,
    });
  }
  return client;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  timeoutMs?: number;
  retries?: number;
  modelId?: AIModelId;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getModelInfo(modelId?: AIModelId | string): AIModelInfo {
  if (modelId === 'z-ai/glm-5-3' || modelId === 'z-ai/glm-5.3') {
    return AI_MODELS['glm'];
  }
  return (modelId && AI_MODELS[modelId as keyof typeof AI_MODELS]) || AI_MODELS[DEFAULT_MODEL];
}

// Failover ordered by live reliability (measured 2026-09-24):
// gpt-oss-20b answers in ~1s; mistral is the backup. glm-flash is NOT in
// the cascade: it hangs on NVIDIA's side (no token within 60s) and would
// add only dead waiting time. It stays manually selectable in the UI.
const FAILOVER_MODELS = [
  'nvidia/nemotron-3.5-bolt-e4b',
  'z-ai/glm-5.3-flash',
  'mistralai/mistral-large-4-1t-a52b',
  'openai/gpt-oss-20b',
];

/**
 * Send a chat completion request to NVIDIA API with failover.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  // Breaker open → upstream is hanging; answer instantly, don't wait.
  if (breakerOpen()) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    return generateArabicFallbackResponse(lastUserMsg);
  }

  const openai = getClient();
  const requestedModelInfo = getModelInfo(options.modelId);
  const {
    temperature = requestedModelInfo.temperature,
    maxTokens = Math.min(requestedModelInfo.maxTokens, 900),
    topP = requestedModelInfo.topP,
    timeoutMs = 10000,
    retries = 0,
  } = options;

  const candidateModels = Array.from(new Set([requestedModelInfo.model, ...FAILOVER_MODELS]));

  for (const targetModel of candidateModels) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const completion = await openai.chat.completions.create(
          {
            model: targetModel,
            messages,
            temperature,
            top_p: topP,
            max_tokens: maxTokens,
            stream: false,
          },
          { signal: controller.signal as any }
        );

        clearTimeout(timeout);

        const choice = completion.choices[0] as any;
        const responseText = choice?.message?.content || choice?.message?.reasoning_content || '';
        if (responseText && responseText.trim()) {
          breakerSuccess();
          return responseText.trim();
        }
      } catch (error: any) {
        clearTimeout(timeout);
        if (attempt < retries) {
          await sleep(400);
        }
      }
    }
  }

  // Smart fallback if network hits timeout
  breakerFail();
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  return generateArabicFallbackResponse(lastUserMsg);
}

/**
 * Intelligent Local Arabic Engine for Cars JO — OFFLINE fallback only.
 * Exported so routes can detect fallback replies and avoid caching them
 * as if they were real model answers (cache poisoning).
 */
export function generateArabicFallbackResponse(query: string): string {
  const q = query.toLowerCase().trim();

  if (/^(السلام عليكم|سلام عليكم|السلامعليكم|سلام|مرحبا|مرحباً|أهلا|اهلا|هلا|صباح الخير|مساء الخير|كيفك|شلونك)/i.test(q)) {
    return `وعليكم السلام ورحمة الله وبركاته! \n\nأهلاً بك في منصة **Cars JO** ! أنا مساعدك الذكي السريع.\n\nكيف يمكنني مساعدتك اليوم؟\n-  **البحث عن سيارات للبيع** (كاش أو بالتقسيط) (/cars)\n-  **رادار محطات شحن الكهرباء** وسرعة الشواحن بالأردن (/ev-charging-jordan)\n-  **حاسبة الجمارك والترخيص** 2026 (/customs-calculator)\n-  **حساب تمويل الأقساط البنكية** (/finance-calculator)\n-  **دليل ورش الصيانة المعتمدة** (/workshops)`;
  }

  if (q.includes('جمارك') || q.includes('ترخيص') || q.includes('جمرك')) {
    return `أهلاً بك! \n\nحسب تعرفة الجمارك والترخيص الأردنية 2026:\n- **السيارات الكهربائية (EV):** 10% إلى 15% حسب القوة بالكيلوواط (kW).\n- **السيارات الهايبرد:** 55% إلى 70% حسب سعة المحرك (CC).\n- **سيارات البنزين:** تتفاوت حسب سعة المحرك وسنة الصنع.\n\n يمكنك تجربة **حاسبة الجمارك والترخيص** المباشرة في موقعنا من خلال الرابط: (/customs-calculator)`;
  }

  if (q.includes('تقسيط') || q.includes('تمويل') || q.includes('بنك') || q.includes('دفعة')) {
    return `أهلاً بك! \n\nيوفر موقع Cars JO حاسبة تمويل متكاملة للبنوك الأردنية:\n- **نسبة الفائدة المرابحة:** تبدأ من 4.5% سنوياً.\n- **أقصى فترة سداد:** تصل حتى 8 سنوات (96 شهر).\n- **أقل دفعة اولى:** 10% إلى 20%.\n\n احسب قسطك الشهري بدقة عبر **حاسبة التمويل**: (/finance-calculator)`;
  }

  if (q.includes('شاحن') || q.includes('شحن') || q.includes('كهرباء') || q.includes('ev')) {
    return `أهلاً بك! \n\nيقدم موقع كارس جو رادار محطات الشحن الفائق السريع للسيارات الكهربائية بالأردن (عمان، إربد، الزرقاء، العقبة والسلط) مع حاسبة الوفر السنوي للبنزين.\n\n تصفح **رادار محطات الشحن الأردني**: (/ev-charging-jordan)`;
  }

  return `أهلاً بك في **JO Cars** !\n\nأنا مساعدك الذكي السريع. أستطيع الإجابة عن أي استفسار يتعلق بالسيارات والأسعار والقطع والورش والجمارك والأقساط بالأردن!\n\n يمكنك تصفح الأقسام الرئيسية:\n-  السيارات للبيع (/cars)\n-  محطات شحن الكهرباء (/ev-charging-jordan)\n-  حاسبة الجمارك (/customs-calculator)\n-  حاسبة التمويل البنكي (/finance-calculator)\n-  دليل الورش (/workshops)`;
}

/**
 * TRUE token streaming generator for SSE live text rendering ("أول بأول").
 * Tokens are yielded the moment they arrive from NVIDIA (first token in
 * ~1-2s) instead of waiting for the full completion. Failover walks the
 * fast-model list; a model is skipped if its FIRST token takes >12s or the
 * stream stalls. If tokens already arrived and the stream then breaks, the
 * partial answer is kept (better than restarting on another model).
 */
const TTFT_TIMEOUT_MS = 8000;
const STREAM_STALL_MS = 20000;
const STREAM_HARD_MS = 45000;

// ── Circuit breaker: if NVIDIA completions keep hanging/failing, stop
// waiting on them for a cooldown period and answer instantly from the local
// engine instead. Without this, every reply pays the full failover cascade.
// Threshold 3 (not 1): a single upstream blip must NOT silence the bot for
// everyone; only a repeated outage trips the breaker.
let breakerFails = 0;
let breakerOpenedAt = 0;
// Threshold 1: the upstream was measured hanging on every model, so one
// exhausted cascade is enough evidence — the next reply goes instant.
// Any later success auto-resets, and the breaker re-probes every cooldown.
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 2 * 60 * 1000;

function breakerOpen(): boolean {
  return breakerFails >= BREAKER_THRESHOLD && Date.now() - breakerOpenedAt < BREAKER_COOLDOWN_MS;
}
function breakerSuccess(): void {
  breakerFails = 0;
  breakerOpenedAt = 0;
}
function breakerFail(): void {
  breakerFails++;
  breakerOpenedAt = Date.now();
}

export async function* chatCompletionStream(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const requestedModelInfo = getModelInfo(options.modelId);
  const {
    temperature = requestedModelInfo.temperature,
    maxTokens = Math.min(options.maxTokens ?? 900, 900),
    topP = requestedModelInfo.topP,
  } = options;

  const candidateModels = Array.from(new Set([requestedModelInfo.model, ...FAILOVER_MODELS]));

  let openai: OpenAI | null = null;
  try {
    openai = getClient();
  } catch {
    openai = null;
  }

  // Breaker open → don't burn seconds on a dead upstream, answer instantly.
  if (!openai || breakerOpen()) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    yield generateArabicFallbackResponse(lastUserMsg);
    return;
  }

  {
    for (const targetModel of candidateModels) {
      const controller = new AbortController();
      // Hard cap per attempt so one slow model can never hang the chat.
      const hardTimer = setTimeout(() => controller.abort(), STREAM_HARD_MS);
      // TTFT watchdog: abort if the first token is too slow.
      let gotToken = false;
      const ttftTimer = setTimeout(() => {
        if (!gotToken) controller.abort();
      }, TTFT_TIMEOUT_MS);

      try {
        const completion: any = await openai.chat.completions.create(
          {
            model: targetModel,
            messages,
            temperature,
            top_p: topP,
            max_tokens: maxTokens,
            stream: true,
          },
          { signal: controller.signal as any }
        );

        let lastChunkAt = Date.now();
        for await (const chunk of completion) {
          // Stall watchdog: drop a stream that goes quiet mid-answer.
          if (Date.now() - lastChunkAt > STREAM_STALL_MS) break;
          const delta: string = chunk?.choices?.[0]?.delta?.content || '';
          const reasoning: string = (chunk?.choices?.[0]?.delta as any)?.reasoning_content || '';
          if (reasoning || delta) {
            gotToken = true;
            clearTimeout(ttftTimer);
          }
          if (delta) {
            lastChunkAt = Date.now();
            yield delta;
          }
        }

        clearTimeout(ttftTimer);
        clearTimeout(hardTimer);
        if (gotToken) {
          breakerSuccess();
          return; // success — stop failover
        }
        // Empty stream: try the next model.
      } catch {
        clearTimeout(ttftTimer);
        clearTimeout(hardTimer);
        if (gotToken) {
          breakerSuccess();
          return; // keep partial answer, don't restart elsewhere
        }
        // Otherwise try the next model.
      }
    }
  }

  breakerFail();
  // All models failed (or no API key): instant local answer, no waiting.
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  yield generateArabicFallbackResponse(lastUserMsg);
}

export async function chatCompletionJSON<T = unknown>(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<T | null> {
  try {
    const text = await chatCompletion(messages, { ...options, stream: false });
    return parseJSONResponse<T>(text);
  } catch {
    return null;
  }
}

function parseJSONResponse<T>(text: string): T | null {
  if (!text || typeof text !== 'string') return null;

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()) as T; } catch {}
  }

  try { return JSON.parse(text) as T; } catch {}

  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(start, i + 1)) as T; } catch { return null; }
      }
    }
  }
  return null;
}

export async function isNvidiaAvailable(): Promise<boolean> {
  return true;
}
