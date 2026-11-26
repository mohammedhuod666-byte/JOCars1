'use client';

import { useState, useEffect } from 'react';
import { KeyRound, Copy, Download, Check, ShieldCheck, RefreshCw, AlertTriangle, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export function downloadRecoveryKeyFile(key: string, email?: string) {
  const content = [
    'JO Cars - مفتاح الاسترداد السري (Argon2id)',
    '==========================================',
    email ? `الحساب: ${email}` : '',
    `المفتاح: ${key}`,
    `تاريخ الإنشاء: ${new Date().toLocaleString('ar-JO')}`,
    '',
    'تنبيه أمني مهم:',
    '- هذا المفتاح يُستخدم لمرة واحدة لاستعادة كلمة المرور دون الحاجة لأي وسيط.',
    '- احتفظ بهذا الملف في مكان آمن ولا تشاركه مع أي شخص.',
  ]
    .filter(Boolean)
    .join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'JOCars-Recovery-Key.txt';
  a.click();
  URL.revokeObjectURL(url);
}

export function RecoveryKeyCard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showRotateInput, setShowRotateInput] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/recovery-key', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setHasKey(!!d.data.hasRecoveryKey);
          setCreatedAt(d.data.createdAt || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/auth/recovery-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword: currentPassword || undefined }),
      });
      const d = await res.json();
      if (d.success && d.data?.recoveryKey) {
        setGeneratedKey(d.data.recoveryKey);
        setHasKey(true);
        setCreatedAt(d.data.createdAt || new Date().toISOString());
        setShowRotateInput(false);
        setCurrentPassword('');
        toast.success('تم توليد مفتاح الاسترداد السري بنجاح — احفظه الآن');
      } else {
        toast.error(d.error || 'فشل توليد المفتاح');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toast.success('تم نسخ مفتاح الاسترداد');
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="card p-6 flex items-center gap-3 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin text-[#ffc640]" />
        <span>جاري فحص حالة مفتاح الاسترداد...</span>
      </div>
    );
  }

  return (
    <div className="card p-5 sm:p-6 border border-white/[0.08]" dir="rtl">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffc640]/15 border border-[#ffc640]/30 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-[#ffc640]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              مفتاح الاسترداد السري (Argon2id)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              يُحفظ مشفراً بشكل أحادي الاتجاه لاستعادة حسابك فوراً بدون أي وسيط
            </p>
          </div>
        </div>
        {hasKey && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            مُفعّل
          </span>
        )}
      </div>

      {/* Show newly generated key ONCE */}
      {generatedKey && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-start gap-2 text-xs text-amber-200 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">احفظ هذا المفتاح الآن:</strong> يظهر مرة واحدة فقط ولن نتمكن من عرضه مجدداً لأنه مشفر بـ Argon2id.
            </span>
          </div>
          <div
            className="p-3 rounded-xl bg-[#090b10] border border-white/10 text-center font-mono text-sm sm:text-base font-bold tracking-wider text-[#ffc640] select-all"
            dir="ltr"
          >
            {generatedKey}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="h-10 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ المفتاح'}</span>
            </button>
            <button
              type="button"
              onClick={() => downloadRecoveryKeyFile(generatedKey, user?.email)}
              className="h-10 rounded-xl bg-[#ffc640] hover:brightness-105 text-[#080a0a] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل ملف .txt</span>
            </button>
          </div>
        </div>
      )}

      {/* Old account without key yet */}
      {!hasKey && !generatedKey && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
          <p className="text-xs text-amber-200 leading-relaxed">
            حسابك مسجّل قبل تفعيل ميزة مفتاح الاسترداد السري. يمكنك توليده الآن بضغطة واحدة لتتمكن من استعادة كلمة مرورك فوراً في أي وقت.
          </p>
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={generating}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#ffc640]/20 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>توليد مفتاح استرداد سري الآن</span>
          </button>
        </div>
      )}

      {/* Existing key rotation */}
      {hasKey && !showRotateInput && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {createdAt ? `تاريخ التفعيل: ${new Date(createdAt).toLocaleDateString('ar-JO')}` : 'المفتاح مخفي ومشفر بأمان'}
          </span>
          <button
            type="button"
            onClick={() => setShowRotateInput(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-gray-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#ffc640]" />
            <span>تجديد المفتاح</span>
          </button>
        </div>
      )}

      {hasKey && showRotateInput && (
        <form onSubmit={handleGenerate} className="mt-3 space-y-3 p-4 rounded-2xl bg-[#090b10] border border-white/[0.08]">
          <label className="block text-xs font-semibold text-gray-300">
            أدخل كلمة المرور الحالية لتأكيد تجديد المفتاح (سيتم إبطال المفتاح القديم):
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="كلمة المرور الحالية"
              className="w-full h-11 pr-10 pl-4 rounded-xl bg-[#11141b] border border-white/[0.1] text-white text-sm outline-none focus:border-[#ffc640]"
              dir="ltr"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowRotateInput(false);
                setCurrentPassword('');
              }}
              className="flex-1 h-10 rounded-xl border border-white/[0.1] text-xs font-bold text-gray-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={generating}
              className="flex-1 h-10 rounded-xl bg-[#ffc640] text-[#080a0a] text-xs font-bold flex items-center justify-center gap-1.5"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>توليد مفتاح جديد</span>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
