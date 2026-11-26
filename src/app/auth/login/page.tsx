'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import {
  Car,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Users,
  ChevronLeft,
  Phone,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [mounted, setMounted] = useState(false);

  // Passwordless phone login (OTP over WhatsApp)
  const [tab, setTab] = useState<'password' | 'otp'>('password');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      let data: {
        success?: boolean;
        error?: string;
        data?: { user: Parameters<typeof login>[0]; token: string };
      } | null = null;
      try {
        data = await res.json();
      } catch {
        toast.error(`تعذر الوصول للخادم (${res.status}) — تحقق من الإنترنت وحاول مجدداً`);
        return;
      }

      if (data && data.success && data.data) {
        login(data.data.user, data.data.token);
        toast.success('تم تسجيل الدخول بنجاح');
        router.push('/');
      } else {
        toast.error((data && data.error) || `فشل تسجيل الدخول (${res.status})`);
      }
    } catch {
      toast.error('حدث خطأ في الاتصال — تحقق من الإنترنت وحاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone }),
      });
      let data: {
        success?: boolean;
        message?: string;
        error?: string;
        whatsappConfigured?: boolean;
        devCode?: string;
      } | null = null;
      try {
        data = await res.json();
      } catch {
        toast.error(`تعذر الوصول للخادم (${res.status}) — تحقق من الإنترنت وحاول مجدداً`);
        return;
      }
      if (data && data.success) {
        setOtpStep('code');
        toast.success(data.message || 'تم إرسال الرمز');
        if (data.whatsappConfigured === false) {
          toast.error('تنبيه: خدمة واتساب غير مفعلة — تواصل مع الإدارة لتفعيل الرموز', {
            duration: 6000,
          });
        }
      } else {
        toast.error((data && data.error) || `فشل إرسال الرمز (${res.status})`, { duration: 6000 });
        if (data && data.devCode) {
          setOtpCode(data.devCode);
          setOtpStep('code');
          toast.success(`وضع التطوير: رمزك هو ${data.devCode}`, { duration: 10000 });
        }
      }
    } catch {
      toast.error('حدث خطأ في الاتصال — تحقق من الإنترنت وحاول مجدداً');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, code: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.data.user, data.data.token);
        toast.success('تم تسجيل الدخول بنجاح');
        router.push('/');
      } else {
        toast.error(data.error || 'فشل التحقق');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-x-hidden bg-[#07090d]" dir="rtl">
      {/* ═══ Left/Right Visual Showcase (Desktop) ═══ */}
      <div className="hidden lg:flex lg:w-[54%] relative items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: "url('/hero-porsche.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#07090d] via-[#07090d]/75 to-[#07090d]/45" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#07090d] to-transparent" />

        <div className="relative z-10 px-14 max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffc640]/10 border border-[#ffc640]/25 text-[#ffc640] text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              منصة السيارات الأولى في الأردن
            </div>

            <h1 className="text-5xl font-black text-white leading-tight mb-5">
              سوق السيارات
              <br />
              <span className="text-[#ffc640]">الأردني</span> الأرقى
            </h1>
            <p className="text-base text-[#a1a1aa] leading-relaxed max-w-md">
              منصة ذكية تجمع بين البائعين والمشترين بأمان وشفافية. تصفح السيارات المفحوصة، قيّم مركبتك بالذكاء الاصطناعي، وتواصل مباشرة دون وسطاء.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 grid grid-cols-3 gap-3.5"
          >
            {[
              { icon: Car, label: 'إعلانات مباشرة', sub: 'تواصل فوري مع المالك' },
              { icon: ShieldCheck, label: 'أمان وشفافية', sub: 'تقارير فحص واضحة' },
              { icon: Zap, label: 'تقييم ذكي', sub: 'تحليل دقيق للأسعار' },
            ].map((feat, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#11141b]/70 backdrop-blur-md border border-white/[0.08] flex flex-col items-start gap-2"
              >
                <div className="w-9 h-9 rounded-xl bg-[#ffc640]/10 border border-[#ffc640]/20 flex items-center justify-center">
                  <feat.icon className="w-4 h-4 text-[#ffc640]" />
                </div>
                <div className="text-xs font-bold text-white">{feat.label}</div>
                <div className="text-[11px] text-[#909096] leading-snug">{feat.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ═══ Form Panel (Mobile-First) ═══ */}
      <div className="w-full lg:w-[46%] flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-24 sm:px-8 lg:py-10 relative">
        {/* Ambient background glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[360px] h-[360px] bg-[#ffc640]/[0.06] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-[260px] h-[260px] bg-blue-500/[0.04] rounded-full blur-[110px] pointer-events-none" />

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile Brand Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:hidden flex flex-col items-center text-center mb-6"
          >
            <Link href="/" className="inline-flex items-center gap-3 mb-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] shadow-lg shadow-[#ffc640]/25 flex items-center justify-center">
                <Car className="w-6 h-6 text-[#080a0a]" />
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-white tracking-tight block leading-none">
                  JO Cars
                </span>
                <span className="text-[11px] text-[#ffc640]/90 font-medium">سوق السيارات الأردني</span>
              </div>
            </Link>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mb-5 text-center lg:text-right"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1.5">مرحباً بعودتك</h2>
            <p className="text-[#9ca3af] text-xs sm:text-sm">
              سجل دخولك للوصول إلى حسابك ومتابعة سياراتك المفضلة
            </p>
          </motion.div>

          {/* Glassmorphic Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative bg-[#11141b]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-5 sm:p-7 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.75)]">
              {/* Gold top highlight */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-[2px] bg-gradient-to-r from-transparent via-[#ffc640]/75 to-transparent rounded-full" />

              {/* Login method tabs with sliding pill */}
              <div className="relative grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-[#090b10] border border-white/[0.06] mb-6">
                {[
                  { id: 'password' as const, label: 'كلمة المرور', icon: Lock },
                  { id: 'otp' as const, label: 'رمز واتساب', icon: Phone },
                ].map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`relative z-10 h-11 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        active ? 'text-[#080a0a]' : 'text-[#9ca3af] hover:text-white'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="loginMethodTab"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#eab308] shadow-md shadow-[#ffc640]/20 -z-10"
                        />
                      )}
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {tab === 'password' ? (
                  <motion.form
                    key="password-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {/* Email / Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                        البريد الإلكتروني أو رقم الهاتف
                      </label>
                      <div className="relative group">
                        <Mail className="w-4 h-4 text-[#6b7280] group-focus-within:text-[#ffc640] transition-colors absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="example@email.com أو 0791234567"
                          className="w-full h-12 pr-10 pl-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                        كلمة المرور
                      </label>
                      <div className="relative group">
                        <Lock className="w-4 h-4 text-[#6b7280] group-focus-within:text-[#ffc640] transition-colors absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full h-12 pr-10 pl-11 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all"
                          dir="ltr"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-[#6b7280] hover:text-white transition-colors"
                          aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember / Forgot */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-2 text-[#9ca3af] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-white/20 bg-[#090b10] accent-[#ffc640]"
                        />
                        <span>تذكرني</span>
                      </label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-[#ffc640] hover:text-[#ffd56b] font-semibold transition-colors"
                      >
                        نسيت كلمة المرور؟
                      </Link>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading || !mounted}
                      className="w-full h-12 mt-1 bg-gradient-to-r from-[#ffc640] via-[#f5bc2e] to-[#e3aa00] hover:brightness-105 active:scale-[0.99] text-[#080a0a] font-bold rounded-xl shadow-lg shadow-[#ffc640]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-[#080a0a]/25 border-t-[#080a0a] rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>تسجيل الدخول</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : otpStep === 'phone' ? (
                  <motion.form
                    key="otp-phone-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSendOtp}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                        رقم الهاتف (واتساب)
                      </label>
                      <div className="relative group">
                        <Phone className="w-4 h-4 text-[#6b7280] group-focus-within:text-[#ffc640] transition-colors absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value)}
                          placeholder="0791234567"
                          className="w-full h-12 pr-10 pl-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all"
                          dir="ltr"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-[#9ca3af] mt-2 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>سنرسل لك رمز تحقق مكوّن من 6 أرقام عبر واتساب</span>
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full h-12 bg-gradient-to-r from-[#ffc640] via-[#f5bc2e] to-[#e3aa00] text-[#080a0a] font-bold rounded-xl shadow-lg shadow-[#ffc640]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {otpLoading ? (
                        <div className="w-5 h-5 border-2 border-[#080a0a]/25 border-t-[#080a0a] rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>إرسال رمز التحقق</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="otp-code-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-[#d1d5db]">
                          رمز التحقق المرسل إلى <span dir="ltr">{otpPhone}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep('phone');
                            setOtpCode('');
                          }}
                          className="text-xs text-[#ffc640] hover:underline font-medium"
                        >
                          تغيير الرقم
                        </button>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="------"
                        className="w-full h-12 px-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-white text-center text-xl font-bold tracking-[0.45em] placeholder-[#52525b] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all"
                        dir="ltr"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full h-12 bg-gradient-to-r from-[#ffc640] via-[#f5bc2e] to-[#e3aa00] text-[#080a0a] font-bold rounded-xl shadow-lg shadow-[#ffc640]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {otpLoading ? (
                        <div className="w-5 h-5 border-2 border-[#080a0a]/25 border-t-[#080a0a] rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>تأكيد الدخول</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3.5 bg-[#11141b] text-[#71717a] text-xs font-medium">أو</span>
                </div>
              </div>

              {/* Google Login */}
              <GoogleLoginButton />

              {/* Register Link */}
              <Link
                href="/auth/register"
                className="mt-3 flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-white/[0.1] bg-white/[0.02] text-[#e4e4e7] font-semibold hover:bg-white/[0.05] hover:border-[#ffc640]/40 transition-all text-sm"
              >
                <span>إنشاء حساب جديد</span>
                <ChevronLeft className="w-4 h-4 text-[#ffc640]" />
              </Link>
            </div>
          </motion.div>

          {/* Compact Trust Strip */}
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {[
              { icon: ShieldCheck, text: 'آمن', sub: 'تشفير كامل' },
              { icon: Zap, text: 'سريع', sub: 'بحث ذكي' },
              { icon: Users, text: 'مجاني', sub: 'بدون عمولة' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-[#11141b]/60 border border-white/[0.06] text-center"
              >
                <item.icon className="w-4 h-4 text-[#ffc640] mb-1.5" />
                <span className="text-xs font-bold text-white leading-none">{item.text}</span>
                <span className="text-[10px] text-[#9ca3af] mt-1">{item.sub}</span>
              </div>
            ))}
          </div>

          {/* Legal Footer */}
          <p className="text-center text-[#9ca3af] text-xs mt-6 leading-relaxed">
            بالدخول إلى حسابك، أنت توافق على{' '}
            <Link
              href="/terms"
              className="text-[#e4e4e7] hover:text-[#ffc640] transition-colors underline underline-offset-4"
            >
              شروط الاستخدام
            </Link>{' '}
            و{' '}
            <Link
              href="/privacy"
              className="text-[#e4e4e7] hover:text-[#ffc640] transition-colors underline underline-offset-4"
            >
              سياسة الخصوصية
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
