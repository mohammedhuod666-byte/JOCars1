'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Check,
  ShieldCheck,
  Phone,
  HelpCircle,
  Car,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadRecoveryKeyFile } from '@/components/auth/RecoveryKeyCard';

export default function ForgotPasswordPage() {
  const [tab, setTab] = useState<'recovery' | 'legacy'>('recovery');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Recovery Key Reset Form
  const [identifier, setIdentifier] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newReplacementKey, setNewReplacementKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Legacy Account Request Form
  const [legacyId, setLegacyId] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [legacySent, setLegacySent] = useState(false);

  const handleRecoveryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'recovery-key',
          identifier,
          recoveryKey,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewReplacementKey(data.newRecoveryKey || 'DONE');
        toast.success('تم تغيير كلمة المرور بنجاح');
      } else {
        toast.error(data.error || 'فشل التحقق من البيانات');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleLegacyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'legacy-request',
          identifier: legacyId,
          contactPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLegacySent(true);
        toast.success('تم إرسال طلبك للإدارة بنجاح');
      } else {
        toast.error(data.error || 'تعذر إرسال الطلب');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!newReplacementKey || newReplacementKey === 'DONE') return;
    navigator.clipboard.writeText(newReplacementKey);
    setCopied(true);
    toast.success('تم نسخ المفتاح الجديد');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-6 pb-24 bg-[#07090d] relative overflow-x-hidden" dir="rtl">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[380px] h-[380px] bg-[#ffc640]/[0.06] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[430px] relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] shadow-lg shadow-[#ffc640]/25 flex items-center justify-center">
              <Car className="w-6 h-6 text-[#080a0a]" />
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-white block leading-none">JO Cars</span>
              <span className="text-[11px] text-[#ffc640]/90 font-medium">استعادة الحساب الآمنة</span>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5">استعادة كلمة المرور</h1>
          <p className="text-xs sm:text-sm text-[#9ca3af]">
            استعادة فورية مشفرة بـ Argon2id داخل الموقع دون الحاجة لأي وسيط
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#11141b]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-5 sm:p-7 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.75)]"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-[2px] bg-gradient-to-r from-transparent via-[#ffc640]/75 to-transparent rounded-full" />

          {newReplacementKey ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white">تم تعيين كلمة المرور الجديدة</h2>
              <p className="text-xs text-[#9ca3af] leading-relaxed">
                لأن مفتاح الاسترداد يُستخدم لمرة واحدة فقط، تم إبطال المفتاح القديم وتوليد مفتاح جديد لك. احفظه الآن في مكان آمن:
              </p>

              {newReplacementKey !== 'DONE' && (
                <>
                  <div
                    className="p-3.5 rounded-xl bg-[#090b10] border border-[#ffc640]/30 font-mono text-sm sm:text-base font-bold tracking-wider text-[#ffc640] select-all"
                    dir="ltr"
                  >
                    {newReplacementKey}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="h-11 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'تم النسخ' : 'نسخ المفتاح'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadRecoveryKeyFile(newReplacementKey, identifier)}
                      className="h-11 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4 text-[#ffc640]" />
                      <span>تنزيل .txt</span>
                    </button>
                  </div>
                </>
              )}

              <Link
                href="/auth/login"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#ffc640]/20"
              >
                <span>تسجيل الدخول الآن</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-[#090b10] border border-white/[0.06] mb-5">
                <button
                  type="button"
                  onClick={() => setTab('recovery')}
                  className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    tab === 'recovery'
                      ? 'bg-gradient-to-r from-[#ffc640] to-[#eab308] text-[#080a0a]'
                      : 'text-[#9ca3af] hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>بمفتاح الاسترداد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('legacy')}
                  className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    tab === 'legacy'
                      ? 'bg-gradient-to-r from-[#ffc640] to-[#eab308] text-[#080a0a]'
                      : 'text-[#9ca3af] hover:text-white'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>حساب قديم بدون مفتاح</span>
                </button>
              </div>

              {tab === 'recovery' ? (
                <form onSubmit={handleRecoveryReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                      البريد الإلكتروني أو رقم الهاتف
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#6b7280] absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="example@email.com أو 0791234567"
                        className="w-full h-12 pr-10 pl-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] outline-none focus:border-[#ffc640]/70"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                      مفتاح الاسترداد السري
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#6b7280] absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={recoveryKey}
                        onChange={(e) => setRecoveryKey(e.target.value.toUpperCase())}
                        placeholder="JOC-XXXX-XXXX-XXXX-XXXX"
                        className="w-full h-12 pr-10 pl-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-[#ffc640] font-mono placeholder-[#52525b] text-sm outline-none focus:border-[#ffc640]/70"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                      كلمة المرور الجديدة
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#6b7280] absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="8 أحرف مع حرف كبير وصغير ورقم ورمز"
                        className="w-full h-12 pr-10 pl-11 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] outline-none focus:border-[#ffc640]/70"
                        dir="ltr"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-[#6b7280] hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] font-bold text-sm shadow-lg shadow-[#ffc640]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-[#080a0a]/25 border-t-[#080a0a] rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>تعيين كلمة المرور الجديدة</span>
                      </>
                    )}
                  </button>
                </form>
              ) : legacySent ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">تم استلام طلبك</h2>
                  <p className="text-xs text-[#9ca3af] leading-relaxed">
                    تم إرسال إشعار فوري للإدارة لمراجعة بيانات حسابك القديم والتواصل معك برابط استعادة مؤقت صالح لـ 15 دقيقة.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLegacyRequest} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 leading-relaxed">
                    إذا كان حسابك مسجلاً قبل إطلاق ميزة مفتاح الاسترداد السري، أدخل بياناتك وسيتواصل معك فريق الإدارة لتزويدك برابط استعادة مؤقت.
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                      البريد الإلكتروني المسجل
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#6b7280] absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={legacyId}
                        onChange={(e) => setLegacyId(e.target.value)}
                        placeholder="example@email.com"
                        className="w-full h-12 pr-10 pl-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] outline-none focus:border-[#ffc640]/70"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                      رقم هاتف للتواصل (واتساب)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#6b7280] absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="0791234567"
                        className="w-full h-12 pr-10 pl-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] outline-none focus:border-[#ffc640]/70"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] font-bold text-sm shadow-lg shadow-[#ffc640]/20 disabled:opacity-50"
                  >
                    {loading ? 'جاري الإرسال...' : 'إرسال طلب استعادة الحساب'}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9ca3af] hover:text-[#ffc640] transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة لتسجيل الدخول</span>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
