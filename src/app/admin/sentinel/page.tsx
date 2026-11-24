'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, ShieldCheck, Shield, AlertTriangle, UserX, CheckCircle,
  Clock, Globe, Terminal, RefreshCw, Loader2, Zap, Power, Filter, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SQL_INJECTION: { label: 'حقن قواعد بيانات SQLi', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
  XSS_ATTACK: { label: 'هجوم سكربتات خبيثة XSS', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  PATH_TRAVERSAL: { label: 'تخطي مسارات وسيرفرات', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  SCANNER_PROBE: { label: 'أداة مسح واختراق تلقائي', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  ADMIN_PROBE: { label: 'محاولة اقتحام لوحة الإدارة', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
  ADMIN_PROBE_GUEST: { label: 'طرق باب الإدارة (زائر)', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  HONEYPOT: { label: 'مسار فخ أمني (Honeypot)', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  BRUTE_FORCE: { label: 'تخمين كلمات مرور متكرر', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  SPAM_LISTING: { label: 'سبام إعلانات متتالية', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  SPAM_MESSAGE: { label: 'سبام رسائل متتالية', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  RATE_ABUSE: { label: 'تجاوز معدل الطلبات المسموح', color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/30' },
};

export default function AdminSentinelPage() {
  const { user, isAuthenticated, _hydrated } = useAuth();
  const router = useRouter();

  const [signals, setSignals] = useState<any[]>([]);
  const [pendingThreats, setPendingThreats] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [mode, setMode] = useState<'monitor' | 'enforce'>('monitor');
  const [stopped, setStopped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [modeChanging, setModeChanging] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    if (typeFilter) params.set('type', typeFilter);

    try {
      const res = await fetch(`/api/admin/sentinel?${params.toString()}`, {
        headers: { Authorization: `Bearer ${useAuth.getState().token}` },
        credentials: 'include',
      });
      const d = await res.json();
      if (d.success) {
        setSignals(d.data.signals || []);
        setPendingThreats(d.data.pendingThreats || []);
        setStats(d.data.stats || null);
        setMode(d.data.mode || 'monitor');
        setStopped(!!d.data.stopped);
        setTotal(d.data.total || 0);
        setTotalPages(d.data.totalPages || 1);
      }
    } catch {
      toast.error('تعذر جلب بيانات الحارس الأمني');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/');
      return;
    }
    if (_hydrated && isAuthenticated && user?.role === 'ADMIN') {
      load();
    }
  }, [_hydrated, isAuthenticated, user, router, load]);

  // Handle Admin Decision: "هل أحظره أم أتركه؟"
  const handleDecision = async (
    signal: any,
    decision: 'ban' | 'pardon',
    duration: '7d' | '30d' | 'permanent' = '30d'
  ) => {
    setActingId(signal.id);
    try {
      const res = await fetch('/api/admin/sentinel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuth.getState().token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'decide',
          decision,
          signalId: signal.id,
          userId: signal.user?.id || signal.userId || null,
          ip: signal.ip || null,
          banDuration: duration,
          reason: `قرار الأدمن بناءً على إنذار Sentinel: ${signal.detail || signal.type}`,
        }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) {
        toast.success(
          decision === 'ban'
            ? 'تم حظر المستخدم والـ IP فوراً وإيقافه عن الموقع'
            : 'تمت المسامحة وتجاهل الإنذار بنجاح'
        );
        // Remove from pending list optimistically
        setPendingThreats((prev) => prev.filter((p) => p.id !== signal.id));
        load(true);
      } else {
        toast.error(d?.error || 'فشل تنفيذ القرار');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setActingId(null);
    }
  };

  // Toggle Auto-Ban Mode
  const toggleAutoBanMode = async (targetMode: 'enforce' | 'monitor') => {
    setModeChanging(true);
    try {
      const res = await fetch('/api/admin/sentinel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuth.getState().token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ mode: targetMode }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) {
        setMode(d.data.mode);
        toast.success(
          targetMode === 'enforce'
            ? 'تم تفعيل الحظر التلقائي الفوري: سيتم حظر أي مخترق مباشرة بدون استئذان'
            : 'تم تفعيل وضع التنبيه والاستئذان: سيتم تنبيهك أولاً وسؤالك (هل أحظره أم أتركه؟)'
        );
      } else {
        toast.error(d?.error || 'فشل تحديث وضع الحارس');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setModeChanging(false);
    }
  };

  // Emergency Stop Switch
  const toggleEmergencyStop = async () => {
    const nextStopped = !stopped;
    if (!confirm(nextStopped ? 'إيقاف طوارئ: سيوقف كل عمليات الحظر التلقائي مؤقتاً؟' : 'إعادة تشغيل الحارس الأمني فوراً؟')) {
      return;
    }
    setModeChanging(true);
    try {
      const res = await fetch('/api/admin/sentinel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuth.getState().token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ stopped: nextStopped }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) {
        setStopped(d.data.stopped);
        toast.success(nextStopped ? 'تم تفعيل إيقاف الطوارئ' : 'تم استئناف عمل الحارس الأمني');
      }
    } catch {
      toast.error('تعذر تحديث الحالة');
    } finally {
      setModeChanging(false);
    }
  };

  if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) return null;

  return (
    <div className="space-y-6 pb-20 text-slate-100 max-w-7xl mx-auto px-2 sm:px-4">
      
      {/* Cockpit Header */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#121624] via-[#0f121d] to-[#0a0c14] border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl border ${
              stopped
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : mode === 'enforce'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}>
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">الحارس الأمني الذكي (Security Sentinel)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/[0.06] border border-white/[0.1] text-amber-300">
                  AI Defense Pro
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                نظام حماية متطور لرصد ومكافحة محاولات الاختراق، حقن قواعد البيانات SQLi، هجمات XSS، روبوتات المسح، وتأمين الموقع على مدار 24 ساعة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => load()}
              disabled={loading}
              className="p-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث البيانات</span>
            </button>
            <button
              onClick={toggleEmergencyStop}
              disabled={modeChanging}
              className={`px-4 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                stopped
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{stopped ? 'إعادة تشغيل الحارس' : 'إيقاف طوارئ'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Auto-Ban Mode Controller Card (Enforce vs Monitor) */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all shadow-xl ${
        stopped
          ? 'bg-slate-900/60 border-slate-800'
          : mode === 'enforce'
          ? 'bg-gradient-to-r from-rose-950/40 via-[#14121d] to-[#121624] border-rose-500/30'
          : 'bg-gradient-to-r from-amber-950/40 via-[#181512] to-[#121624] border-amber-500/30'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                stopped ? 'bg-slate-500' : mode === 'enforce' ? 'bg-rose-500 animate-ping' : 'bg-amber-400 animate-pulse'
              }`} />
              <h2 className="text-base sm:text-lg font-black text-white">
                {stopped
                  ? 'الحارس في حالة إيقاف طوارئ مؤقت'
                  : mode === 'enforce'
                  ? 'وضع الحظر التلقائي الفوري (بدون استئذان) مُفعل'
                  : 'وضع التنبيه والاستئذان (يسألك: هل أحظره أم أتركه؟) مُفعل'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {mode === 'enforce'
                ? 'الحارس الذكي يعمل بكامل طاقته الصارمة: أي مستخدم أو عنوان IP يحاول تنفيذ هجمات SQLi، XSS، مسح واختراق، يتم حظره مباشرة بدون استئذان.'
                : 'الحارس الذكي يراقب ويرصد كل محاولة اعتداء بدقة، ويمنحك السيطرة الكاملة: يرسل لك تنبيهاً فورياً بالسؤال "هل أحظره أم أتركه؟" لتتخذ قرار الحظر أو العفو بضغطة زر واحدة.'}
            </p>
          </div>

          {/* Switcher Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={modeChanging || mode === 'monitor'}
              onClick={() => toggleAutoBanMode('monitor')}
              className={`flex-1 sm:flex-initial px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'monitor' && !stopped
                  ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20 scale-[1.02]'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>وضع الاستئذان والتنبيه</span>
            </button>

            <button
              type="button"
              disabled={modeChanging || mode === 'enforce'}
              onClick={() => toggleAutoBanMode('enforce')}
              className={`flex-1 sm:flex-initial px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'enforce' && !stopped
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-black shadow-lg shadow-rose-500/25 scale-[1.02]'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08]'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>وضع الحظر التلقائي المباشر</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP PRIORITY: Pending Threats Needing Admin Decision */}
      {pendingThreats.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#14121a] border-2 border-rose-500/40 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-rose-300">
                  محاولات اختراق واعتداء بحاجة لقرارك: هل تحظره أم تتركه؟
                </h3>
                <p className="text-xs text-slate-400">
                  تم رصد هذه المحاولات بواسطة الحارس. اتخذ قرارك المباشر بالحظر الفوري أو المسامحة.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black">
              {pendingThreats.length} إنذارات بانتظارك
            </span>
          </div>

          <div className="space-y-3">
            {pendingThreats.map((threat) => {
              const cfg = TYPE_CONFIG[threat.type] || { label: threat.type, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
              const isActing = actingId === threat.id;

              return (
                <div
                  key={threat.id}
                  className="p-4 rounded-2xl bg-[#181d2c]/90 border border-white/[0.08] hover:border-rose-400/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {threat.user ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                          <span className="text-slate-400">المستخدم:</span>
                          <Link href="/admin/users" className="hover:underline text-amber-400">
                            {threat.user.name} ({threat.user.email})
                          </Link>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">زائر بدون حساب</span>
                      )}
                      {threat.ip && (
                        <span className="text-xs text-slate-400 font-mono bg-black/40 px-2 py-0.5 rounded-lg border border-white/[0.04]">
                          IP: {threat.ip}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(threat.createdAt).toLocaleString('ar-JO')}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-mono bg-[#0c0e15] p-2.5 rounded-xl border border-white/[0.06] break-all">
                      {threat.detail || 'محاولة اعتداء رصدها الحارس'}
                    </p>
                  </div>

                  {/* Decision Controls: "هل أحظره أم أتركه؟" */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleDecision(threat, 'ban', '30d')}
                      className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-500/20 active:scale-95 disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>{isActing ? 'جاري المعالجة...' : 'احظره (30 يوم)'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleDecision(threat, 'ban', 'permanent')}
                      className="px-3 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>حظر دائم</span>
                    </button>

                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleDecision(threat, 'pardon')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 border border-white/[0.06]"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>اتركه (مسامحة)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-1">
            <p className="text-xs text-slate-400 font-bold">عمليات الحظر خلال 24 ساعة</p>
            <p className="text-2xl sm:text-3xl font-black text-rose-500 tabular-nums">{stats.bans24h}</p>
            <p className="text-[10px] text-slate-500">تم شل حركتهم وتأمين الموقع</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-1">
            <p className="text-xs text-slate-400 font-bold">إنذارات تحت المراقبة</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">{stats.wouldBans24h}</p>
            <p className="text-[10px] text-slate-500">محاولات استوقفت الحارس</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-1">
            <p className="text-xs text-slate-400 font-bold">إجمالي الإشارات المسجلة</p>
            <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">{total}</p>
            <p className="text-[10px] text-slate-500">في سجل المراقبة الأمني</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-1">
            <p className="text-xs text-slate-400 font-bold">حالة الحماية الذاتية</p>
            <p className="text-lg sm:text-xl font-black text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{stopped ? 'موقوف' : 'نشط 100%'}</span>
            </p>
            <p className="text-[10px] text-slate-500">تحديث فوري على مدار الساعة</p>
          </div>
        </div>
      )}

      {/* Filter & Logs Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121622] p-3.5 sm:p-4 rounded-2xl border border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-300">تصفية نوع الهجوم:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-white/[0.1] bg-[#0c0e15] text-white text-xs outline-none focus:border-amber-400"
            >
              <option value="">جميع أنواع الهجمات والإشارات</option>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400">إجمالي النتائج المعروضة: {total}</span>
        </div>

        {/* Signals List / Cards (Mobile-optimized with Zero Horizontal Scrolling!) */}
        {loading ? (
          <div className="p-16 rounded-3xl bg-[#121622] border border-white/[0.08] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : signals.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[#121622] border border-white/[0.08] text-center space-y-2">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-white font-bold text-sm">الموقع هادئ تماماً — لا توجد إشارات مشبوهة حالياً</p>
            <p className="text-xs text-slate-500">الحارس الأمني يراقب كافة الطلبات لحماية النظام</p>
          </div>
        ) : (
          <div className="space-y-3">
            
            {/* Mobile View: High-Tech Touch Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {signals.map((s) => {
                const cfg = TYPE_CONFIG[s.type] || { label: s.type, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' };
                return (
                  <div key={s.id} className="p-4 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(s.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">المستخدم:</span>
                        {s.user ? (
                          <span className="font-bold text-white">
                            {s.user.name} {s.user.banStatus && <span className="text-rose-400 text-[10px]">(محظور)</span>}
                          </span>
                        ) : (
                          <span className="text-slate-500">زائر غير مسجل</span>
                        )}
                      </div>
                      {s.ip && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                          <span>IP:</span>
                          <span>{s.ip}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300 font-mono bg-[#0c0e15] p-2.5 rounded-xl border border-white/[0.06] break-all leading-relaxed">
                      {s.detail || '—'}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Grid Table */}
            <div className="hidden md:block rounded-3xl bg-[#121622] border border-white/[0.08] overflow-hidden shadow-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#181d2c] text-slate-400 border-b border-white/[0.08]">
                  <tr>
                    <th className="p-4 font-black">نوع التهديد</th>
                    <th className="p-4 font-black">المستخدم / الهوية</th>
                    <th className="p-4 font-black">تفاصيل السلوك / المسار</th>
                    <th className="p-4 font-black">عنوان IP</th>
                    <th className="p-4 font-black">خطورة</th>
                    <th className="p-4 font-black">الوقت والتاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {signals.map((s) => {
                    const cfg = TYPE_CONFIG[s.type] || { label: s.type, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' };
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="p-4">
                          {s.user ? (
                            <div>
                              <Link href="/admin/users" className="font-bold text-white hover:text-amber-400">
                                {s.user.name}
                              </Link>
                              {s.user.banStatus && (
                                <span className="mr-2 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                                  محظور
                                </span>
                              )}
                              <p className="text-[10px] text-slate-500">{s.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-medium">زائر</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-300 max-w-xs truncate" title={s.detail || ''}>
                          {s.detail || '—'}
                        </td>
                        <td className="p-4 font-mono text-slate-400">{s.ip || '—'}</td>
                        <td className="p-4">
                          <span className="font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                            {s.weight}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(s.createdAt).toLocaleString('ar-JO')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl bg-[#121622] border border-white/[0.08] text-xs font-bold disabled:opacity-40 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              الصفحة السابقة
            </button>
            <span className="text-xs text-slate-400">
              صفحة {page} من {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl bg-[#121622] border border-white/[0.08] text-xs font-bold disabled:opacity-40 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              الصفحة التالية
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
