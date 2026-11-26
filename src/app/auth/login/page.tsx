'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { Car, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap, Users, ChevronLeft, Phone, MessageCircle } from 'lucide-react';
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

      let data: { success?: boolean; error?: string; data?: { user: Parameters<typeof login>[0]; token: string } } | null = null;
      try {
        data = await res.json();
      } catch {
        toast.error(`تعذر الوصول للخادم (${res.status}) — تحقق من الإنترنت وحاول مجددا`);
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
      toast.error('حدث خطأ في الاتصال — تحقق من الإنترنت وحاول مجددا');
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
      let data: { success?: boolean; message?: string; error?: string; whatsappConfigured?: boolean; devCode?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        toast.error(`تعذر الوصول للخادم (${res.status}) — تحقق من الإنترنت وحاول مجددا`);
        return;
      }
      if (data && data.success) {
        setOtpStep('code');
        toast.success(data.message || 'تم إرسال الرمز');
        if (data.whatsappConfigured === false) {
          toast.error('تنبيه: خدمة واتساب غير مفعلة — تواصل مع الإدارة لتفعيل الرموز', { duration: 6000 });
        }
      } else {
        toast.error((data && data.error) || `فشل إرسال الرمز (${res.status})`, { duration: 6000 });
        // Dev mode: server returns the code when WhatsApp is not configured
        if (data && data.devCode) {
          setOtpCode(data.devCode);
          setOtpStep('code');
          toast.success(`وضع التطوير: رمزك هو ${data.devCode}`, { duration: 10000 });
        }
      }
    } catch {
      toast.error('حدث خطأ في الاتصال — تحقق من الإنترنت وحاول مجددا');
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
    <div className="min-h-screen flex relative overflow-hidden bg-[#080a0a]">
      {/* ═══ Left Panel — Car Visual (hidden on mobile) ═══ */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-porsche.jpg')" }}
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080a0a]/95 via-[#080a0a]/70 to-[#080a0a]/40" />
        {/* Bottom gradient for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#080a0a] to-transparent" />

        {/* Content on left panel */}
        <div className="relative z-10 px-16 max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Gold accent line */}
            <div className="w-16 h-1 bg-gradient-to-r from-[#ffc640] to-[#ffc640]/40 rounded-full mb-8" />

            <h1 className="text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>
              سوق السيارات<br />
              <span className="text-[#ffc640]">الأردني</span> الأرقى
            </h1>
            <p className="text-lg text-[#909096] leading-relaxed max-w-md">
              منصة ذكية تجمع بين البائعين والمشترين بأمان وشفافية. تصفح السيارات وتواصل مباشرة دون وسطاء.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 grid grid-cols-3 gap-3"
          >
            {[
              { icon: '🚗', label: 'إعلانات مباشرة', sub: 'تواصل فوري مع المالك' },
              { icon: '🛡️', label: 'أمان وشفافية', sub: 'بيانات فحص واضحة' },
              { icon: '⚡', label: 'تقييم ذكي', sub: 'تحليل دقيق للأسعار' },
            ].map((feat, i) => (
              <div key={i} className="text-center p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-xl mb-1">{feat.icon}</div>
                <div className="text-xs font-bold text-white">{feat.label}</div>
                <div className="text-[10px] text-[#909096] mt-0.5">{feat.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Decorative floating car badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-16 right-16 z-10"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#ffc640]/10 border border-[#ffc640]/20 flex items-center justify-center backdrop-blur-sm">
            <Car className="w-10 h-10 text-[#ffc640]" />
          </div>
        </motion.div>
      </div>

      {/* ═══ Right Panel — Login Form ═══ */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#ffc640]/[0.03] rounded-full blur-[150px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] shadow-lg shadow-[#ffc640]/20 mb-4">
              <Car className="w-7 h-7 text-[#080a0a]" />
            </div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>
              JO Cars
            </h1>
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>
              مرحباً بعودتك
            </h2>
            <p className="text-[#909096] text-sm">
              سجل دخولك للوصول إلى حسابك وتصفح السيارات
            </p>
          </motion.div>

          {/* Login Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Glass card */}
            <div className="bg-[#141616]/80 backdrop-blur-2xl rounded-3xl border border-[#282a2b]/60 p-8 shadow-2xl shadow-black/30">
              {/* Gold accent line at top of card */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-[#ffc640]/60 to-transparent rounded-full" />

              {/* Login method tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#1a1c1c]/80 border border-[#333535]/60 mb-5">
                <button type="button" onClick={() => setTab('password')}
                  className={`py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'password' ? 'bg-[#ffc640] text-[#080a0a]' : 'text-[#909096] hover:text-white'}`}>
                  <Lock className="w-4 h-4" /> كلمة المرور
                </button>
                <button type="button" onClick={() => setTab('otp')}
                  className={`py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'otp' ? 'bg-[#ffc640] text-[#080a0a]' : 'text-[#909096] hover:text-white'}`}>
                  <Phone className="w-4 h-4" /> رمز واتساب
                </button>
              </div>

              {tab === 'password' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email or phone */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">
                    البريد الإلكتروني أو رقم الهاتف
                  </label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909096] group-focus-within:text-[#ffc640] transition-colors duration-300">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      placeholder="البريد أو رقم الهاتف (079...)"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      autoComplete="username"
                      inputMode="email"
                      required
                      className="w-full h-13 pr-12 pl-4 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">
                    كلمة المرور
                  </label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909096] group-focus-within:text-[#ffc640] transition-colors duration-300">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      autoComplete="current-password"
                      required
                      className="w-full h-13 pr-12 pl-12 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#909096] hover:text-[#ffc640] transition-colors duration-200 flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-[#333535] bg-[#1a1c1c] text-[#ffc640] focus:ring-[#ffc640]/20 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-[#909096] group-hover:text-[#c6c6cc] transition-colors">
                      تذكرني
                    </span>
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-[#ffc640]/80 hover:text-[#ffc640] transition-colors duration-200"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01, boxShadow: '0 0 30px rgba(255, 198, 64, 0.2)' }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full h-13 bg-gradient-to-r from-[#ffc640] to-[#e3aa00] hover:from-[#ffd060] hover:to-[#ffc640] text-[#080a0a] font-bold rounded-xl shadow-lg shadow-[#ffc640]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm"
                  style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#080a0a]/20 border-t-[#080a0a] rounded-full animate-spin" />
                  ) : (
                    <>
                      تسجيل الدخول
                      <ArrowRight className="w-5 h-5 rotate-180" />
                    </>
                  )}
                </motion.button>
              </form>
              ) : otpStep === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">
                    رقم الهاتف الأردني
                  </label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909096] group-focus-within:text-[#ffc640] transition-colors duration-300">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      placeholder="0791234567"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      dir="ltr"
                      required
                      className="w-full h-13 pr-12 pl-4 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none text-left"
                    />
                  </div>
                  <p className="text-[11px] text-[#909096]">نرسل رمز دخول لمرة واحدة على واتساب — بدون كلمة مرور</p>
                </div>
                <motion.button
                  type="submit"
                  disabled={otpLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full h-13 bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] font-bold rounded-xl shadow-lg shadow-[#ffc640]/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
                >
                  {otpLoading ? (
                    <div className="w-5 h-5 border-2 border-[#080a0a]/20 border-t-[#080a0a] rounded-full animate-spin" />
                  ) : (
                    <>إرسال رمز الدخول<MessageCircle className="w-5 h-5" /></>
                  )}
                </motion.button>
              </form>
              ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">
                    رمز الدخول المرسل إلى {otpPhone}
                  </label>
                  <input
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    inputMode="numeric"
                    dir="ltr"
                    required
                    className="w-full h-13 px-4 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-center text-2xl font-black tracking-[0.5em] transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 outline-none"
                  />
                  <button type="button" onClick={() => { setOtpStep('phone'); setOtpCode(''); }}
                    className="text-xs text-[#ffc640]/80 hover:text-[#ffc640] transition-colors">
                    تغيير الرقم
                  </button>
                </div>
                <motion.button
                  type="submit"
                  disabled={otpLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full h-13 bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] font-bold rounded-xl shadow-lg shadow-[#ffc640]/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
                >
                  {otpLoading ? (
                    <div className="w-5 h-5 border-2 border-[#080a0a]/20 border-t-[#080a0a] rounded-full animate-spin" />
                  ) : (
                    <>تأكيد الدخول<ArrowRight className="w-5 h-5 rotate-180" /></>
                  )}
                </motion.button>
              </form>
              )}

              {/* Divider */}
              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#333535]/40" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-[#141616]/80 text-[#909096] text-xs uppercase tracking-wider">
                    أو
                  </span>
                </div>
              </div>

              {/* Google login */}
              <GoogleLoginButton />

              {/* Register Link */}
              <Link
                href="/auth/register"
                className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-[#333535]/60 text-[#c6c6cc] font-medium hover:bg-[#1a1c1c] hover:border-[#ffc640]/30 transition-all duration-300 text-sm"
              >
                إنشاء حساب جديد
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 grid grid-cols-3 gap-4"
          >
            {[
              { icon: Shield, text: 'آمن', sub: 'تشفير كامل' },
              { icon: Zap, text: 'سريع', sub: 'بحث ذكي' },
              { icon: Users, text: 'مجاني', sub: 'بدون رسوم' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1a1c1c]/80 border border-[#333535]/40 flex items-center justify-center group-hover:border-[#ffc640]/30 group-hover:bg-[#ffc640]/5 transition-all duration-300">
                  <item.icon className="w-5 h-5 text-[#909096] group-hover:text-[#ffc640] transition-colors duration-300" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold text-[#c6c6cc] block">{item.text}</span>
                  <span className="text-[10px] text-[#909096]">{item.sub}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-center text-[#909096] text-xs mt-8 leading-relaxed"
          >
            بالدخول إلى حسابك، أنت توافق على{''}
            <Link href="/terms" className="text-[#c6c6cc] hover:text-[#ffc640] transition-colors underline underline-offset-2">
              شروط الاستخدام
            </Link>
            {''}و{''}
            <Link href="/privacy" className="text-[#c6c6cc] hover:text-[#ffc640] transition-colors underline underline-offset-2">
              سياسة الخصوصية
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
