'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import {
  Car,
  User,
  Mail,
  Lock,
  Phone,
  Store,
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  Wrench,
  ChevronLeft,
  Building2,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Copy,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadRecoveryKeyFile } from '@/components/auth/RecoveryKeyCard';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [accountType, setAccountType] = useState<'USER' | 'TRADER' | 'DEALER'>('USER');
  const isDealerLike = accountType === 'TRADER' || accountType === 'DEALER';
  const isTrader = accountType === 'TRADER';
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dealerName: '',
    dealerDescription: '',
    dealerAddress: '',
    commercialReg: '',
  });

  const passwordRequirements = [
    { text: '8 أحرف على الأقل', met: form.password.length >= 8 },
    { text: 'حرف كبير (A-Z)', met: /[A-Z]/.test(form.password) },
    { text: 'حرف صغير (a-z)', met: /[a-z]/.test(form.password) },
    { text: 'رقم (0-9)', met: /\d/.test(form.password) },
    {
      text: 'رمز خاص (!@#$%)',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      const role = accountType === 'USER' ? 'USER' : accountType;
      const cleanName = form.name.trim();
      const cleanEmail = form.email.trim().toLowerCase();
      const cleanPhone = form.phone.trim();
      const payload = isTrader
        ? {
            name: cleanName,
            email: cleanEmail,
            password: form.password,
            phone: cleanPhone,
            role,
            dealerName: form.dealerName.trim(),
            dealerDescription: form.dealerDescription || undefined,
            dealerAddress: form.dealerAddress || undefined,
            commercialReg: form.commercialReg || undefined,
          }
        : isDealerLike
        ? {
            name: cleanName,
            email: cleanEmail,
            password: form.password,
            phone: cleanPhone,
            role,
            dealerName: form.dealerName.trim(),
          }
        : { name: cleanName, email: cleanEmail, password: form.password, phone: cleanPhone, role };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        try {
          sessionStorage.setItem('jocars_just_registered', '1');
          if (data.data?.user?.id) {
            localStorage.setItem(`jocars_onboard_enabled_${data.data.user.id}`, '1');
          }
        } catch {}
        login(data.data.user, data.data.token);
        toast.success(isTrader ? 'تم استلام طلبك — سيتم مراجعته خلال 24 ساعة' : 'تم إنشاء الحساب بنجاح');
        if (data.data.recoveryKey) {
          setIssuedKey(data.data.recoveryKey);
        } else {
          router.push('/');
        }
      } else {
        toast.error(data.error || 'فشل إنشاء الحساب');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-x-hidden bg-[#07090d]" dir="rtl">
      {issuedKey && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
          <div className="w-full max-w-md bg-[#11141b] border border-[#ffc640]/30 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ffc640]/15 border border-[#ffc640]/30 flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-[#ffc640]" />
            </div>
            <h3 className="text-xl font-black text-white">احفظ مفتاح الاسترداد السري</h3>
            <p className="text-xs text-[#9ca3af] leading-relaxed">
              هذا المفتاح محمي بتشفير أحادي الاتجاه ويظهر <strong className="text-[#ffc640]">مرة واحدة فقط</strong>. احتفظ به لاستعادة حسابك فوراً إذا نسيت كلمة المرور:
            </p>
            <div className="p-3.5 rounded-xl bg-[#090b10] border border-white/10 font-mono text-sm sm:text-base font-bold tracking-wider text-[#ffc640] select-all" dir="ltr">
              {issuedKey}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(issuedKey);
                  setCopiedKey(true);
                  toast.success('تم نسخ المفتاح');
                }}
                className="h-11 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? 'تم النسخ' : 'نسخ المفتاح'}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadRecoveryKeyFile(issuedKey, form.email)}
                className="h-11 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4 text-[#ffc640]" />
                <span>تنزيل .txt</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] font-bold text-sm shadow-lg shadow-[#ffc640]/20"
            >
              حفظت المفتاح، المتابعة إلى الموقع
            </button>
          </div>
        </div>
      )}
      {/* ═══ Visual Showcase (Desktop) ═══ */}
      <div className="hidden lg:flex lg:w-[52%] relative items-center justify-center overflow-hidden">
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
              انضم مجاناً في أقل من دقيقة
            </div>

            <h1 className="text-5xl font-black text-white leading-tight mb-5">
              انضم إلى
              <br />
              <span className="text-[#ffc640]">مجتمع السيارات</span>
              <br />
              الأردني
            </h1>
            <p className="text-base text-[#a1a1aa] leading-relaxed max-w-md">
              أنشئ حسابك كفرد أو تاجر أو معرض سيارات، وانشر إعلاناتك وتابع تقارير الفحص والتقييم الذكي بكل أمان.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 grid grid-cols-3 gap-3.5"
          >
            {[
              { number: 'مجاني', label: 'التسجيل للأفراد' },
              { number: '24 ساعة', label: 'توثيق المعارض' },
              { number: '100%', label: 'تشفير وحماية' },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#11141b]/70 backdrop-blur-md border border-white/[0.08] text-center"
              >
                <div className="text-lg font-black text-[#ffc640]">{stat.number}</div>
                <div className="text-[11px] text-[#9ca3af] mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ═══ Register Form Panel (Mobile-First) ═══ */}
      <div className="w-full lg:w-[48%] flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-24 sm:px-8 lg:py-10 relative">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[380px] h-[380px] bg-[#ffc640]/[0.05] rounded-full blur-[130px] pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10">
          {/* Mobile Brand Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:hidden flex flex-col items-center text-center mb-5"
          >
            <Link href="/" className="inline-flex items-center gap-3">
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

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mb-5 text-center lg:text-right"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1.5">إنشاء حساب جديد</h2>
            <p className="text-[#9ca3af] text-xs sm:text-sm">
              اختر نوع حسابك وابدأ البيع والشراء بثقة في الأردن
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative bg-[#11141b]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-5 sm:p-7 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.75)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-[2px] bg-gradient-to-r from-transparent via-[#ffc640]/75 to-transparent rounded-full" />

              {/* Account Type Sliding Tabs */}
              <div className="relative grid grid-cols-3 gap-1 p-1.5 rounded-2xl bg-[#090b10] border border-white/[0.06] mb-5">
                {[
                  { key: 'USER' as const, label: 'مستخدم', icon: User },
                  { key: 'TRADER' as const, label: 'تاجر سيارات', icon: Store },
                  { key: 'DEALER' as const, label: 'معرض', icon: Building2 },
                ].map((tabItem) => {
                  const active = accountType === tabItem.key;
                  return (
                    <button
                      key={tabItem.key}
                      type="button"
                      onClick={() => setAccountType(tabItem.key)}
                      className={`relative z-10 h-11 rounded-xl text-[11px] sm:text-xs font-bold transition-colors flex items-center justify-center gap-1.5 px-1 ${
                        active ? 'text-[#080a0a]' : 'text-[#9ca3af] hover:text-white'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="registerAccountType"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#eab308] shadow-md shadow-[#ffc640]/20 -z-10"
                        />
                      )}
                      <tabItem.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{tabItem.label}</span>
                    </button>
                  );
                })}
              </div>

              {isTrader && (
                <div className="mb-5 p-3.5 rounded-2xl bg-[#ffc640]/10 border border-[#ffc640]/25 text-xs text-[#fde68a] flex items-start gap-2.5 leading-relaxed">
                  <Wrench className="w-4 h-4 text-[#ffc640] shrink-0 mt-0.5" />
                  <span>
                    حساب <strong className="text-white">تاجر السيارات</strong> يمنحك صفحة تاجر موثقة ومزايا عرض متقدمة. تتم مراجعة الطلب من الإدارة خلال 24 ساعة.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                    الاسم الكامل
                  </label>
                  <div className="relative group">
                    <User className="w-4 h-4 text-[#6b7280] group-focus-within:text-[#ffc640] transition-colors absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="محمد أحمد"
                      className="w-full h-12 pr-10 pl-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Email & Phone Grid on larger mobile/desktop, stacked on small */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                      البريد الإلكتروني
                    </label>
                    <div className="relative group">
                      <Mail className="w-4 h-4 text-[#6b7280] group-focus-within:text-[#ffc640] transition-colors absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="name@email.com"
                        className="w-full h-12 pr-10 pl-3 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                      رقم الهاتف
                    </label>
                    <div className="relative group">
                      <Phone className="w-4 h-4 text-[#6b7280] group-focus-within:text-[#ffc640] transition-colors absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="0791234567"
                        className="w-full h-12 pr-10 pl-3 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Dealer / Trader Name */}
                {isDealerLike && (
                  <div>
                    <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                      {isTrader ? 'اسم التاجر أو النشاط التجاري *' : 'اسم المعرض *'}
                    </label>
                    <div className="relative group">
                      <Store className="w-4 h-4 text-[#6b7280] group-focus-within:text-[#ffc640] transition-colors absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={form.dealerName}
                        onChange={(e) => setForm({ ...form, dealerName: e.target.value })}
                        placeholder={
                          isTrader ? 'مثال: مركز الفا لبيع السيارات' : 'مثال: معرض النجوم للسيارات'
                        }
                        className="w-full h-12 pr-10 pl-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {isTrader && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                        وصف النشاط (اختياري)
                      </label>
                      <textarea
                        value={form.dealerDescription}
                        onChange={(e) => setForm({ ...form, dealerDescription: e.target.value })}
                        placeholder="تخصصنا، خبرتنا، مناطق العمل..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                          المدينة / العنوان
                        </label>
                        <input
                          type="text"
                          value={form.dealerAddress}
                          onChange={(e) => setForm({ ...form, dealerAddress: e.target.value })}
                          placeholder="عمّان - شارع مكة"
                          className="w-full h-12 px-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#d1d5db] mb-2">
                          رقم السجل التجاري
                        </label>
                        <input
                          type="text"
                          value={form.commercialReg}
                          onChange={(e) => setForm({ ...form, commercialReg: e.target.value })}
                          placeholder="اختياري"
                          className="w-full h-12 px-4 rounded-xl bg-[#090b10] border border-white/[0.09] text-white placeholder-[#52525b] text-[15px] focus:outline-none focus:border-[#ffc640]/70 focus:ring-2 focus:ring-[#ffc640]/15 transition-all"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                )}

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

                  {form.password && (
                    <div className="mt-3 p-3 rounded-xl bg-[#090b10]/80 border border-white/[0.06] grid grid-cols-2 gap-2">
                      {passwordRequirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px]">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              req.met
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-white/[0.05] text-[#6b7280]'
                            }`}
                          >
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className={req.met ? 'text-emerald-400 font-medium' : 'text-[#71717a]'}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 bg-gradient-to-r from-[#ffc640] via-[#f5bc2e] to-[#e3aa00] hover:brightness-105 active:scale-[0.99] text-[#080a0a] font-bold rounded-xl shadow-lg shadow-[#ffc640]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#080a0a]/25 border-t-[#080a0a] rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isTrader ? 'إرسال طلب التاجر' : 'إنشاء حساب مجاني'}</span>
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3.5 bg-[#11141b] text-[#71717a] text-xs font-medium">أو</span>
                </div>
              </div>

              <GoogleLoginButton />

              <Link
                href="/auth/login"
                className="mt-3 flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-white/[0.1] bg-white/[0.02] text-[#e4e4e7] font-semibold hover:bg-white/[0.05] hover:border-[#ffc640]/40 transition-all text-sm"
              >
                <span>لديك حساب بالفعل؟ تسجيل الدخول</span>
                <ChevronLeft className="w-4 h-4 text-[#ffc640]" />
              </Link>
            </div>
          </motion.div>

          {/* Security Note */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#9ca3af]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>بياناتك محمية بتشفير كامل وفق معايير الأمان الحديثة</span>
          </div>

          {/* Legal Footer (properly spaced) */}
          <p className="text-center text-[#9ca3af] text-xs mt-4 leading-relaxed">
            بالتسجيل، أنت توافق على{' '}
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
