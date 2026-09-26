/**
 * AI explanation layer (spec §10, §24): the LLM receives FINAL numbers and
 * writes the human narrative. It never computes prices. On LLM failure the
 * deterministic template is used — the report is never blocked.
 */
import type { ValuationOutput, VehicleSpec } from './types';
import { chatCompletion } from '@/ai/nvidia-client';

function template(spec: VehicleSpec, o: ValuationOutput): string {
  const top = o.sources.map((s) => `${s.label} (${s.count})`).join('، ');
  return (
    `تم تقدير القيمة السوقية بناءً على ${o.comparablesUsed} سيارة مشابهة من ${o.sourcesUsed} مصادر (${top}). ` +
    `تركزت الأسعار المعدلة للمطابقات القوية حول ${o.estimatedPrice.toLocaleString()} دينار بنطاق ${o.minPrice.toLocaleString()}–${o.maxPrice.toLocaleString()} دينار. ` +
    `أثّرت السنة والكيلومترات والفئة أكثر من غيرها، وخُفّض وزن الإعلانات الأقدم والأقل تشابهاً، واستُبعدت القيم الشاذة والمكررة (${o.comparablesFound - o.comparablesUsed} إعلان). ` +
    `مستوى الثقة ${o.confidenceLabel} (${o.confidence}%) — راجع الأسباب المفصلة أدناه.`
  );
}

export async function explainValuation(spec: VehicleSpec, o: ValuationOutput): Promise<string> {
  const facts = [
    `السيارة: ${spec.brand} ${spec.model} ${spec.year} — ${Number(spec.kilometers || 0).toLocaleString()} كم.`,
    `التقدير: ${o.estimatedPrice.toLocaleString()} د.أ. النطاق: ${o.minPrice.toLocaleString()}–${o.maxPrice.toLocaleString()} د.أ.`,
    `الثقة: ${o.confidenceLabel} (${o.confidence}%) للأسباب: ${o.confidenceReasons.join('؛ ')}.`,
    `العينة: ${o.comparablesUsed} مستخدمة من ${o.comparablesFound} مرشحة عبر: ${o.sources.map((s) => `${s.label} (${s.count})`).join('، ')}.`,
    `المنهجية: وسيط مرجح بالتشابه والحداثة والموثوقية (متوسط مرجح ${o.stats.weightedAvg.toLocaleString()}، وسيط ${o.stats.median.toLocaleString()}، IQR ‏${o.stats.iqr.toLocaleString()}).`,
  ].join('\n');
  try {
    const text = await chatCompletion(
      [
        {
          role: 'system',
          content: 'أنت محلل سوق سيارات أردني. اكتب فقرة تفسيرية قصيرة (3-5 جمل) بالعربية الفصحى المبسطة تشرح كيف وُصل للسعر — باستخدام الأرقام المعطاة حرفياً (اذكر رقم التقدير والنطاق والثقة كما هي). ممنوع تغيير أي رقم أو اختراع مصادر أو سيارات. نبرة محايدة مهنية. لا تحيّي المستخدم ولا تعرّف بنفسك — ابدأ بالتفسير مباشرة.',
        },
        { role: 'user', content: `الحقائق المحسوبة (لا تغيّرها):\n${facts}` },
      ],
      { temperature: 0.3, maxTokens: 400, timeoutMs: 15000, retries: 0 },
    );
    if (text && text.trim().length > 40) {
      const t = text.trim();
      // Guard: the shared chat client returns a generic canned fallback when
      // the upstream is unreachable — never present that as an explanation.
      // A genuine explanation must echo at least one computed figure.
      const mustContain = [String(o.estimatedPrice), String(o.minPrice), String(o.maxPrice), String(o.confidence)];
      const echoesNumber = mustContain.some((n) => t.includes(n));
      const looksCanned = /مساعدك الذكي السريع|أهلاً بك في \*\*JO Cars/i.test(t);
      if (echoesNumber && !looksCanned) return t;
    }
  } catch { /* fall through to template */ }
  return template(spec, o);
}
