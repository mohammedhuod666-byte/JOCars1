'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Target,
  RefreshCw,
  Ship,
  TrendingUp,
  TrendingDown,
  Share2,
  Clock,
  Landmark,
  Wrench,
  Award,
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Calculator,
  Copy,
  ExternalLink,
  Flame,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Car,
  Phone,
  Sparkles,
  QrCode,
  Printer,
  Heart,
  CreditCard,
  Lock,
  Compass,
  FileText,
  Users,
} from 'lucide-react';
import { calculateTradeInSwap, TradeInCondition } from '@/ai/dealers/trade-in-engine';
import { calculateImportToZarqa, OriginCountry, ForeignCurrency } from '@/ai/dealers/import-duty-engine';
import { calculateHoldingCost } from '@/ai/dealers/holding-cost-engine';
import { calculateFinancingPreApproval } from '@/ai/dealers/financing-preapproval-engine';
import { getJordanMarketDemandHeatmap } from '@/ai/dealers/demand-heatmap-engine';

// 10 Dealer Intelligence Modules
import { SmartWindowSticker } from './tools/SmartWindowSticker';
import { ReverseBuyerMatching } from './tools/ReverseBuyerMatching';
import { CliqInstantDeposit } from './tools/CliqInstantDeposit';
import { PriceDropRetargeting } from './tools/PriceDropRetargeting';
import { B2BWholesaleFloor } from './tools/B2BWholesaleFloor';
import { WarrantyUpsellCalculator } from './tools/WarrantyUpsellCalculator';
import { SocialMediaSyndication } from './tools/SocialMediaSyndication';
import { BuyerDbrPrescreener } from './tools/BuyerDbrPrescreener';
import { CompetitorWatchdog } from './tools/CompetitorWatchdog';
import { DealerFinancialScorecard } from './tools/DealerFinancialScorecard';

interface Props {
  dealerCars: any[];
  dealerName?: string;
  dealerPhone?: string;
  dealerLogo?: string;
  isVerified?: boolean;
  onRequestVerification?: () => void;
  onShowToast: (msg: string) => void;
}

export function DealerIntelligenceSuite({
  dealerCars,
  dealerName,
  dealerPhone,
  dealerLogo,
  isVerified,
  onRequestVerification,
  onShowToast,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    | 'sniper'
    | 'reverse'
    | 'sticker'
    | 'deposit'
    | 'retarget'
    | 'wholesale'
    | 'warranty'
    | 'syndication'
    | 'prescreen'
    | 'watchdog'
    | 'scorecard'
    | 'tradein'
    | 'import'
    | 'demand'
    | 'pitch'
    | 'holding'
    | 'finance'
    | 'recon'
  >('sniper');

  // Push notification state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [sniperDeals, setSniperDeals] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // Trade-in calculator state
  const [tradeInCustomerValue, setTradeInCustomerValue] = useState(14000);
  const [tradeInCustomerYear, setTradeInCustomerYear] = useState(2018);
  const [tradeInCustomerKm, setTradeInCustomerKm] = useState(130000);
  const [tradeInCondition, setTradeInCondition] = useState<TradeInCondition>('FOUR_CLEAN');
  const [tradeInShowroomPrice, setTradeInShowroomPrice] = useState(21000);
  const [tradeInMarginPct, setTradeInMarginPct] = useState(12);

  // Import calculator state
  const [importOrigin, setImportOrigin] = useState<OriginCountry>('USA_AUCTION');
  const [importPriceForeign, setImportPriceForeign] = useState(17500);
  const [importCurrency, setImportCurrency] = useState<ForeignCurrency>('USD');
  const [importFuel, setImportFuel] = useState<'GASOLINE' | 'HYBRID' | 'ELECTRIC'>('HYBRID');
  const [importEngineCc, setImportEngineCc] = useState(2000);
  const [importTargetProfitPct, setImportTargetProfitPct] = useState(12);

  // Holding cost state
  const [holdingPurchaseCost, setHoldingPurchaseCost] = useState(18000);
  const [holdingAskingPrice, setHoldingAskingPrice] = useState(20500);
  const [holdingDays, setHoldingDays] = useState(48);

  // Financing state
  const [financeCarPrice, setFinanceCarPrice] = useState(19500);
  const [financeDownPaymentPct, setFinanceDownPaymentPct] = useState(25);
  const [financeTenureYears, setFinanceTenureYears] = useState(5);
  const [financeBuyerSalary, setFinanceBuyerSalary] = useState(850);
  const [financeBuyerDebt, setFinanceBuyerDebt] = useState(120);

  // Pitch Deck state
  const [selectedPitchCarId, setSelectedPitchCarId] = useState<string>(dealerCars[0]?.id || '');
  const [pitchCar, setPitchCar] = useState<any>(dealerCars[0] || null);

  useEffect(() => {
    if (dealerCars.length > 0 && !selectedPitchCarId) {
      setSelectedPitchCarId(dealerCars[0].id);
      setPitchCar(dealerCars[0]);
    }
  }, [dealerCars, selectedPitchCarId]);

  useEffect(() => {
    const found = dealerCars.find((c) => c.id === selectedPitchCarId);
    if (found) setPitchCar(found);
  }, [selectedPitchCarId, dealerCars]);

  // Load live sniper deals
  useEffect(() => {
    fetch('/api/dealers/deal-sniper')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.deals) {
          setSniperDeals(d.data.deals);
        }
      })
      .catch(() => {});
  }, []);

  // Check notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEnablePush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      onShowToast('المتصفح لا يدعم إشعارات الدفع المباشرة');
      return;
    }
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        // Register service worker subscription if available
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.pushManager) {
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || undefined,
            });
            const subJson = sub.toJSON();
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: sub.endpoint,
                p256dh: subJson.keys?.p256dh,
                auth: subJson.keys?.auth,
              }),
            });
          }
        }
        onShowToast('تم تفعيل إشعارات اللقطات على شاشة هاتفك مباشرة!');
      } else {
        onShowToast('تم رفض إذن الإشعارات من إعدادات المتصفح');
      }
    } catch {
      onShowToast('حدث خطأ أثناء تفعيل الإشعارات');
    }
    setPushLoading(false);
  };

  const handleSendTestPush = async () => {
    setPushLoading(true);
    try {
      const res = await fetch('/api/dealers/deal-sniper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🔥 رادار كارس جو: لقطة جديدة تم رصدها!',
          message: 'تويوتا كامري 2021 معروضة بسعر 14,800 د.أ (أقل بـ 16% عن تقييم السوق). اضغط لمعاينتها قبل الجميع!',
        }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast('تم إرسال إشعار فوري تجريبي لشاشة هاتفك!');
        // Also trigger browser notification if allowed
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
          new Notification('🔥 رادار كارس جو: لقطة جديدة تم رصدها!', {
            body: 'تويوتا كامري 2021 معروضة بسعر 14,800 د.أ (أقل بـ 16% عن تقييم السوق). اضغط لمعاينتها قبل الجميع!',
          });
        }
      } else {
        onShowToast(data.error || 'فشل إرسال الإشعار');
      }
    } catch {
      onShowToast('حدث خطأ أثناء الاتصال بالرادار');
    }
    setPushLoading(false);
  };

  // Calculations
  const tradeInResult = calculateTradeInSwap({
    customerCarPriceEstimated: tradeInCustomerValue,
    customerCarYear: tradeInCustomerYear,
    customerCarKm: tradeInCustomerKm,
    condition: tradeInCondition,
    showroomCarPrice: tradeInShowroomPrice,
    dealerTargetMarginPercent: tradeInMarginPct,
  });

  const importResult = calculateImportToZarqa({
    origin: importOrigin,
    purchasePriceForeign: importPriceForeign,
    currency: importCurrency,
    fuelType: importFuel,
    engineCc: importEngineCc,
    targetProfitPercent: importTargetProfitPct,
  });

  const holdingResult = calculateHoldingCost({
    carPurchaseCostJod: holdingPurchaseCost,
    currentAskingPriceJod: holdingAskingPrice,
    daysOnLot: holdingDays,
  });

  const financeResult = calculateFinancingPreApproval({
    vehiclePriceJod: financeCarPrice,
    downPaymentPercent: financeDownPaymentPct,
    loanTenureYears: financeTenureYears,
    buyerMonthlySalaryJod: financeBuyerSalary,
    buyerMonthlyDebtJod: financeBuyerDebt,
  });

  const demandData = getJordanMarketDemandHeatmap();

  return (
    <div className="card p-5 sm:p-6 mb-6 border border-emerald-500/20 shadow-xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                منظومة الذكاء التجاري وحصريات التجار (Dealer Pro Suite)
              </h2>
              {isVerified && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  معرض موثّق معتمد
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              رادار صيد اللقطات، حاسبة البدل، تكاليف استيراد الحرة، مؤشر الطلب، وعروض البيع الفاخرة
            </p>
          </div>
        </div>

        {/* Verification Status Pill */}
        <div className="flex items-center gap-2">
          {!isVerified ? (
            <button
              onClick={onRequestVerification}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>طلب شارة المعرض المعتمد</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>شارة ذهبية مفعلة</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 my-4">
        {[
          { id: 'sniper', label: '🔥 رادار اللقطات', icon: Flame },
          { id: 'reverse', label: '🎯 الطلبات المعكوسة', icon: Target },
          { id: 'sticker', label: '🏷️ ملصق الزجاج QR', icon: QrCode },
          { id: 'deposit', label: '💳 عربون كليك', icon: CreditCard },
          { id: 'retarget', label: '📉 تخفيض السعر', icon: TrendingDown },
          { id: 'wholesale', label: '🏬 سوق الجملة B2B', icon: Lock },
          { id: 'warranty', label: '🛡️ أرباح الكفالة', icon: ShieldCheck },
          { id: 'syndication', label: '📲 النشر السريع', icon: Share2 },
          { id: 'prescreen', label: '🏦 فاحص DBR', icon: Landmark },
          { id: 'watchdog', label: '🔍 مؤشر المنافسين', icon: Compass },
          { id: 'scorecard', label: '📊 التقرير المالي', icon: TrendingUp },
          { id: 'tradein', label: '🔄 حاسبة البدل', icon: RefreshCw },
          { id: 'import', label: '🚢 استيراد الحرة', icon: Ship },
          { id: 'demand', label: '📈 مؤشر الطلب', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-1 ring-emerald-400/40'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-gray-800 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate w-full text-center">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DEAL SNIPING & PUSH NOTIFICATIONS ────────────────── */}
      {activeTab === 'sniper' && (
        <div className="space-y-4 pt-2">
          {/* Push Notification Phone Integration Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="font-extrabold text-gray-900 dark:text-white text-sm block">
                  إشعارات رادار صيد اللقطات مباشرة على شاشة الهاتف (Push Notifications)
                </span>
                <span className="text-[11px] text-gray-500 dark:text-slate-400">
                  تصلك رسالة فورية إلى قائمة إشعارات هاتفك بمجرد نشر أي إعلان معروض بأقل من سعر السوق بـ 12%+ دون الحاجة لفتح الموقع!
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={pushLoading || pushEnabled}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 ${
                  pushEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>{pushEnabled ? 'الإشعارات مفعلة بهاتفك ✓' : 'تفعيل إشعارات الهاتف'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={pushLoading}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
                title="إرسال إشعار تجريبي لاختبار وصوله لهاتفك"
              >
                تجربة إشعار حي
              </button>
            </div>
          </div>

          {/* Current Live Deals List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>الصفقات واللقطات المرصودة حالياً بالسوق ({sniperDeals.length})</span>
              </span>
              <span className="text-[10px] text-gray-500">مراقبة حية للأسعار الأقل من تقييم FMV</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sniperDeals.slice(0, 6).map((deal) => (
                <div
                  key={deal.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 transition-all shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{deal.title}</h4>
                      <p className="text-[10px] text-gray-500">
                        {deal.kilometers.toLocaleString()} كم • {deal.city}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      -{deal.discountPercentage}%
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-900 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">السعر المطلوب</span>
                      <span className="font-mono font-black text-rose-500 text-sm">{deal.price.toLocaleString()} د.أ</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">تقييم FMV بالسوق</span>
                      <span className="font-mono font-bold text-gray-400 line-through text-xs">
                        {deal.estimatedFmv.toLocaleString()} د.أ
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ربح مقدر: +{deal.potentialProfitJod.toLocaleString()} د.أ
                    </span>
                    <a
                      href={`/cars/${deal.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>المعاينة الفورية</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: INSTANT TRADE-IN MATRIX ──────────────────────────── */}
      {activeTab === 'tradein' && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Controls */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-500" />
                <span>بيانات سيارة الزبون المعروضة للبدل:</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">القيمة السوقية العادلة (FMV):</label>
                  <input
                    type="number"
                    value={tradeInCustomerValue}
                    onChange={(e) => setTradeInCustomerValue(Number(e.target.value))}
                    className="input text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">سنة الصنع:</label>
                  <input
                    type="number"
                    value={tradeInCustomerYear}
                    onChange={(e) => setTradeInCustomerYear(Number(e.target.value))}
                    className="input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">العداد (كم):</label>
                  <input
                    type="number"
                    value={tradeInCustomerKm}
                    onChange={(e) => setTradeInCustomerKm(Number(e.target.value))}
                    className="input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">سعر سيارة المعرض المطلوبة:</label>
                  <input
                    type="number"
                    value={tradeInShowroomPrice}
                    onChange={(e) => setTradeInShowroomPrice(Number(e.target.value))}
                    className="input text-xs font-mono font-bold text-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 block mb-1">كرت فحص سيارة الزبون:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  {[
                    { id: 'FOUR_CLEAN', label: '4 جيد (نظيف)' },
                    { id: 'THREE_CLEAN', label: '3 جيد (قصعة)' },
                    { id: 'TWO_CLEAN', label: '2 جيد (خلفي)' },
                    { id: 'NEEDS_REPAIR', label: 'مضروب / صيانة' },
                  ].map((cond) => (
                    <button
                      key={cond.id}
                      type="button"
                      onClick={() => setTradeInCondition(cond.id as any)}
                      className={`p-2 rounded-lg font-bold border transition-all ${
                        tradeInCondition === cond.id
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500'
                          : 'bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      {cond.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">هامش ربح المعرض المستهدف من الصفقة:</span>
                  <span className="font-mono font-bold text-emerald-500">{tradeInMarginPct}%</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="20"
                  value={tradeInMarginPct}
                  onChange={(e) => setTradeInMarginPct(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            {/* Instant Calculation Output */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-extrabold text-white">قرار صفقة البدل المالي</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                  Wholesale Intake Engine
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">سعر الشراء التجاري لسيارة الزبون</span>
                  <span className="font-mono font-black text-amber-400 text-base mt-0.5 block">
                    {tradeInResult.wholesaleIntakePriceJod.toLocaleString()} د.أ
                  </span>
                  <span className="text-[10px] text-slate-500">خصم {tradeInResult.wholesaleDiscountPercent}% عن السوق</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-300 font-bold block">الفارق المطلوب من الزبون نقداً</span>
                  <span className="font-mono font-black text-emerald-400 text-lg mt-0.5 block">
                    {tradeInResult.netCashToCollectJod.toLocaleString()} د.أ
                  </span>
                  <span className="text-[10px] text-slate-400">سعر سيارتك - سعر سيارته</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
                <p className="text-emerald-300 font-semibold leading-relaxed">{tradeInResult.dealVerdictAr}</p>
                <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                  <span>ربح المعرض المتوقع: <strong>{tradeInResult.dealerExpectedProfitOnDealJod.toLocaleString()} د.أ</strong></span>
                  <span>كلفة التجهيز والبوليش: <strong>{tradeInResult.reconditioningEstimateJod} د.أ</strong></span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const text = `عرض البدل الرسمي من معرض ${dealerName || ''}:\n- سيارة المعرض: ${tradeInShowroomPrice.toLocaleString()} د.أ\n- القيمة المحسوبة لسيارتك بالبدل: ${tradeInResult.wholesaleIntakePriceJod.toLocaleString()} د.أ\n- الفارق النقدي المطلوب: ${tradeInResult.netCashToCollectJod.toLocaleString()} د.أ نقداً.\nمنصة كارس جو.`;
                    navigator.clipboard.writeText(text);
                    onShowToast('تم نسخ عرض البدل لإرساله للزبون عبر الواتساب!');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Copy className="w-4 h-4" />
                  <span>نسخ بطاقة عرض البدل للواتساب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: IMPORT LANDING COST TO ZARQA FREE ZONE ───────────── */}
      {activeTab === 'import' && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Controls */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-blue-500" />
                <span>بيانات استيراد وشراء السيارة من الخارج:</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">بلد الشراء / المزاد:</label>
                  <select
                    value={importOrigin}
                    onChange={(e) => {
                      const org = e.target.value as OriginCountry;
                      setImportOrigin(org);
                      if (org === 'UAE_DUBAI') setImportCurrency('AED');
                      else setImportCurrency('USD');
                    }}
                    className="input text-xs"
                  >
                    <option value="USA_AUCTION">مزادات أمريكا (Copart / IAAI)</option>
                    <option value="UAE_DUBAI">سوق دبي والإمارات (درهم)</option>
                    <option value="CHINA_EV">المصانع والموانئ الصينية (EV)</option>
                    <option value="KOREA">مزادات كوريا الجنوبية</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">سعر الشراء بالعملة الأجنبية:</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={importPriceForeign}
                      onChange={(e) => setImportPriceForeign(Number(e.target.value))}
                      className="input text-xs font-mono font-bold flex-1"
                    />
                    <span className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400">
                      {importCurrency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">نوع المحرك:</label>
                  <select
                    value={importFuel}
                    onChange={(e) => setImportFuel(e.target.value as any)}
                    className="input text-xs"
                  >
                    <option value="HYBRID">هايبرد (ضريبة 40%)</option>
                    <option value="ELECTRIC">كهرباء بالكامل (10% - 45%)</option>
                    <option value="GASOLINE">بنزين (55% - 85%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">هامش ربح المعرض المستهدف:</label>
                  <input
                    type="number"
                    value={importTargetProfitPct}
                    onChange={(e) => setImportTargetProfitPct(Number(e.target.value))}
                    className="input text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Calculation Output */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/20 via-slate-900 to-slate-950 border border-blue-500/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-extrabold text-white">بيان التكلفة وسعر البيع المقترح</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                  واصل حرة الزرقاء
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">التكلفة واصل الحرة (غير مجمرك)</span>
                  <span className="font-mono font-black text-amber-300 text-base mt-0.5 block">
                    {importResult.totalLandedFreeZoneCostJod.toLocaleString()} د.أ
                  </span>
                  <span className="text-[10px] text-slate-500">شامل الشحن ونقل العقبة</span>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40">
                  <span className="text-[10px] text-blue-300 font-bold block">سعر البيع المقترح بالحرة</span>
                  <span className="font-mono font-black text-blue-200 text-lg mt-0.5 block">
                    {importResult.suggestedFreeZoneSalePriceJod.toLocaleString()} د.أ
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">صافي ربح: +{importResult.projectedNetProfitJod.toLocaleString()} د.أ</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>الشحن البحري للعقبة:</span>
                  <span className="font-mono font-bold">{importResult.oceanFreightJod.toLocaleString()} د.أ</span>
                </div>
                <div className="flex justify-between">
                  <span>رسوم ميناء العقبة والناقلة للحرة:</span>
                  <span className="font-mono font-bold">{importResult.portHandlingAndTransitJod} د.أ</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 text-slate-400">
                  <span>السعر المقترح في حال البيع مجمرك:</span>
                  <span className="font-mono font-bold text-white">{importResult.suggestedDomesticSalePriceJod.toLocaleString()} د.أ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: JORDAN MARKET DEMAND HEATMAP ──────────────────────── */}
      {activeTab === 'demand' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>مؤشر طلب الشارع الأردني لشهر {demandData.reportMonth}</span>
              </h3>
              <p className="text-[11px] text-gray-500">أكثر السيارات تداولاً وسرعة بيع في معارض وحرة الأردن</p>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
              تحديث بيانات شهري
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {demandData.topDemandedModels.map((item) => (
              <div
                key={item.rank}
                className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900 dark:text-white">
                      #{item.rank} {item.make}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                      {item.demandLevelAr}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-700 dark:text-slate-200 mt-1">{item.model}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{item.liquidityVerdictAr}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">متوسط بقائها بالمعرض:</span>
                    <strong className="text-emerald-500">{item.avgDaysOnLot} يوماً فقط</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">متوسط سعر التداول:</span>
                    <strong className="font-mono">{item.averageTransactionPriceJod.toLocaleString()} د.أ</strong>
                  </div>
                </div>

                <div className="pt-1 text-[10px] text-slate-400 border-t border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-gray-600 dark:text-slate-300">توصية الشراء: </span>
                  <span className="text-emerald-500 font-bold">{item.importRecommendationAr}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-bold text-emerald-500 block mb-1">نصيحة الاستيراد: ماذا تشتري؟</span>
              <ul className="space-y-1 text-[11px] text-gray-600 dark:text-slate-300 list-disc list-inside">
                {demandData.traderAdviceAr.whatToBuyAr.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-bold text-rose-500 block mb-1">تنبيه المخاطر: ماذا تتجنب؟</span>
              <ul className="space-y-1 text-[11px] text-gray-600 dark:text-slate-300 list-disc list-inside">
                {demandData.traderAdviceAr.whatToAvoidAr.map((avoid, i) => (
                  <li key={i}>{avoid}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: DEALER PITCH DECK FOR WHATSAPP ───────────────────── */}
      {activeTab === 'pitch' && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-500" />
                <span>مُنشئ بطاقات البيع الفاخرة للواتساب (Branded Dealer Pitch Deck)</span>
              </h3>
              <p className="text-[10px] text-gray-500">اختر سيارة من مخزونك لتوليد بطاقة تسعير وتمويل رسمية باسم معرضك</p>
            </div>

            {/* Car selector */}
            {dealerCars.length > 0 && (
              <select
                value={selectedPitchCarId}
                onChange={(e) => setSelectedPitchCarId(e.target.value)}
                className="input text-xs max-w-xs font-bold"
              >
                {dealerCars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand?.nameAr} {c.model?.nameAr} {c.year} ({c.price.toLocaleString()} د.أ)
                  </option>
                ))}
              </select>
            )}
          </div>

          {pitchCar ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Visual Card Preview */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/30 text-white space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    {dealerLogo ? (
                      <img src={dealerLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                        JO
                      </div>
                    )}
                    <div>
                      <span className="font-extrabold text-sm block">{dealerName || 'معرض كارس جو المعتمد'}</span>
                      <span className="text-[10px] text-amber-400">بطاقة عرض سعر رسمي معتمد</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date().toLocaleDateString('ar-JO')}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">
                    {pitchCar.brand?.nameAr} {pitchCar.model?.nameAr} {pitchCar.year}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    عداد المسافة: {pitchCar.kilometers?.toLocaleString() || 'سيرفس وكالة'} كم • فحص فني معتمد
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">السعر الكاش النهائي</span>
                  <span className="text-3xl font-black text-emerald-400 font-mono mt-0.5 block">
                    {pitchCar.price?.toLocaleString()} د.أ
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    مطابق لتقييم السوق العادل (FMV) في منصة JO Cars
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">دفعة أولى 20%</span>
                    <span className="font-mono font-bold text-amber-300">
                      {Math.round(pitchCar.price * 0.2).toLocaleString()} د.أ
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">قسط شهري (5 سنوات)</span>
                    <span className="font-mono font-bold text-blue-300">
                      {Math.round((pitchCar.price * 0.8 * 1.25) / 60).toLocaleString()} د.أ
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">مرابحة إسلامية</span>
                    <span className="font-bold text-emerald-400">معتمدة</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-white font-bold">{dealerPhone || '07XXXXXXXX'}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">JO CARS PREMIER VERIFIED</span>
                </div>
              </div>

              {/* Share Controls */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">
                    خيارات المشاركة الفورية مع الزبون:
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    انقر لنسخ الرسالة المنسقة خصيصاً للواتساب مع كامل تفاصيل الدفعة والقسط ورابط فحص السيارة الرسمي.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `تفضل صديقي العزيز، تفاصيل سيارة ${pitchCar.brand?.nameAr} ${pitchCar.model?.nameAr} موديل ${pitchCar.year} المعروضة في ${dealerName || 'معرضنا'}:\n\n- السعر النهائي: ${pitchCar.price?.toLocaleString()} د.أ\n- الدفعة الأولى التقديرية (20%): ${Math.round(pitchCar.price * 0.2).toLocaleString()} د.أ\n- القسط الشهري التقريبي (5 سنوات): ${Math.round((pitchCar.price * 0.8 * 1.25) / 60).toLocaleString()} د.أ\n- فحص فني معتمد وشهادة تقييم FMV.\n\nلمعاينة الصور وكامل التفاصيل:\n${window.location.origin}/cars/${pitchCar.id}\n\nللتواصل والاستفسار: ${dealerPhone || ''}`;
                      navigator.clipboard.writeText(text);
                      onShowToast('تم نسخ رسالة الواتساب بالكامل بنجاح!');
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <Copy className="w-4 h-4" />
                    <span>نسخ نص العرض الكامل للواتساب</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `عرض خاص من ${dealerName || 'معرضنا'}: ${pitchCar.brand?.nameAr} ${pitchCar.model?.nameAr} ${pitchCar.year} بسعر ${pitchCar.price?.toLocaleString()} د.أ. تفاصيل كاملة: ${typeof window !== 'undefined' ? window.location.origin : ''}/cars/${pitchCar.id}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>إرسال مباشر عبر تطبيق WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-6">أضف سيارات إلى مخزونك لتوليد عروض الواتساب</p>
          )}
        </div>
      )}

      {/* ── TAB 6: SHOWROOM HOLDING COST TRACKER ────────────────────── */}
      {activeTab === 'holding' && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>حساب تكلفة وقوف وركود السيارة في المعرض:</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">كلفة الشراء ورأس المال:</label>
                  <input
                    type="number"
                    value={holdingPurchaseCost}
                    onChange={(e) => setHoldingPurchaseCost(Number(e.target.value))}
                    className="input text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">السعر المعروض للبيع:</label>
                  <input
                    type="number"
                    value={holdingAskingPrice}
                    onChange={(e) => setHoldingAskingPrice(Number(e.target.value))}
                    className="input text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 block mb-1">عدد أيام الوقوف في المعرض:</label>
                <input
                  type="number"
                  value={holdingDays}
                  onChange={(e) => setHoldingDays(Number(e.target.value))}
                  className="input text-xs font-mono font-black text-amber-500"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-extrabold text-white">تحليل تآكل الربح ومؤشر التسييل</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${holdingResult.liquidationBadgeColor}`}>
                  {holdingResult.liquidationStatusLabelAr}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">إجمالي كلفة الوقوف المتراكمة</span>
                  <span className="font-mono font-black text-rose-400 text-base mt-0.5 block">
                    -{holdingResult.totalHoldingCostAccumulatedJod.toLocaleString()} د.أ
                  </span>
                  <span className="text-[10px] text-slate-500">{holdingResult.dailyHoldingCostJod} د.أ يومياً</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">الربح الصافي المتبقي</span>
                  <span className="font-mono font-black text-emerald-400 text-base mt-0.5 block">
                    +{holdingResult.currentNetProfitRemainingJod.toLocaleString()} د.أ
                  </span>
                  <span className="text-[10px] text-amber-400">تآكل {holdingResult.profitErosionPercent}% من الربح</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                <p className="leading-relaxed">{holdingResult.adviceAr}</p>
                <div className="pt-1 mt-1 border-t border-slate-800 text-[10px] text-amber-400 flex justify-between">
                  <span>سعر التسييل السريع المقترح:</span>
                  <strong className="font-mono">{holdingResult.suggestedLiquidationPriceJod.toLocaleString()} د.أ</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: AUTO-FINANCING PRE-APPROVAL ───────────────────────── */}
      {activeTab === 'finance' && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-emerald-500" />
                <span>بيانات الزبون والتمويل البنكي:</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">سعر السيارة:</label>
                  <input
                    type="number"
                    value={financeCarPrice}
                    onChange={(e) => setFinanceCarPrice(Number(e.target.value))}
                    className="input text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">نسبة الدفعة الأولى:</label>
                  <select
                    value={financeDownPaymentPct}
                    onChange={(e) => setFinanceDownPaymentPct(Number(e.target.value))}
                    className="input text-xs"
                  >
                    <option value={15}>15% (الحد الأدنى)</option>
                    <option value={20}>20% (معتمدة إسلامياً)</option>
                    <option value={25}>25% (شائعة وممتازة)</option>
                    <option value={30}>30% (تخفيض القسط)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">صافي راتب الزبون الشهري:</label>
                  <input
                    type="number"
                    value={financeBuyerSalary}
                    onChange={(e) => setFinanceBuyerSalary(Number(e.target.value))}
                    className="input text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">التزامات وأقساط حالية:</label>
                  <input
                    type="number"
                    value={financeBuyerDebt}
                    onChange={(e) => setFinanceBuyerDebt(Number(e.target.value))}
                    className="input text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-extrabold text-white">أهلية الزبون والبنوك المرشحة</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {financeResult.buyerEligibility.statusLabelAr}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">الدفعة الأولى المطلوبة</span>
                  <span className="font-mono font-black text-amber-400 text-base mt-0.5 block">
                    {financeResult.downPaymentJod.toLocaleString()} د.أ
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-300 font-bold block">القسط الشهري التقديري (5 سنوات)</span>
                  <span className="font-mono font-black text-emerald-400 text-lg mt-0.5 block">
                    {financeResult.estimatedMonthlyInstallmentJod.toLocaleString()} د.أ
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-300 font-bold block">أفضل البنوك الأردنية لتمويل هذه السيارة:</span>
                <div className="space-y-1">
                  {financeResult.recommendedBanks.slice(0, 3).map((b, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">{b.bankNameAr}</span>
                        <span className="text-[10px] text-slate-400">{b.notesAr}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 shrink-0">{b.monthlyInstallmentJod} د.أ/شهر</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: DEALER RECON & PREP NETWORK ──────────────────────── */}
      {activeTab === 'recon' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-500" />
                <span>شبكة خدمات التجهيز السريع بخصومات تجارية حصرية</span>
              </h3>
              <p className="text-[11px] text-gray-500">
                تجهيز وبوليش وصيانة بطاريات وإطارات لسيارات المعرض خلال 24 ساعة بأسعار الجملة
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {[
              {
                title: 'دراي كلين وبوليش نانو سراميك',
                discount: 'خصم 30% للتجار',
                price: 'تبدأ من 45 د.أ',
                provider: 'مراكز العناية الفائقة (عمان والزرقاء)',
                phone: '0795551234',
              },
              {
                title: 'فحص وتبديل خلايا بطاريات الهايبرد',
                discount: 'خصم 20% على الخلايا',
                price: 'ضمان سنة كاملة',
                provider: 'المختبر الأردني لصيانة الهايبرد والكهرباء',
                phone: '0788884321',
              },
              {
                title: 'كوشوك وإطارات ياباني وصيني',
                discount: 'سعر الجملة للمعارض',
                price: 'كفالة مصنعية 3 سنوات',
                provider: 'مجمع إطارات حرة الزرقاء المعتمد',
                phone: '0777779876',
              },
              {
                title: 'فحص شامل وشهادة كرت شاصي وكمبيوتر',
                discount: 'خدمة فحص في المعرض',
                price: 'تقرير إلكتروني فوري',
                provider: 'مراكز أوتوشيك والشريف المعتمدة',
                phone: '065001234',
              },
            ].map((srv, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 block w-fit mb-1.5">
                    {srv.discount}
                  </span>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{srv.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-1">{srv.provider}</p>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{srv.price}</span>
                  <a
                    href={`tel:${srv.phone}`}
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:text-emerald-500 font-mono font-bold flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>اتصال</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 10 DEALER INTELLIGENCE MODULES ──────────────────────────── */}
      {activeTab === 'reverse' && (
        <ReverseBuyerMatching
          dealerCars={dealerCars}
          dealerName={dealerName}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'sticker' && (
        <SmartWindowSticker
          dealerCars={dealerCars}
          dealerName={dealerName}
          dealerPhone={dealerPhone}
          dealerLogo={dealerLogo}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'deposit' && (
        <CliqInstantDeposit
          dealerCars={dealerCars}
          dealerName={dealerName}
          dealerPhone={dealerPhone}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'retarget' && (
        <PriceDropRetargeting
          dealerCars={dealerCars}
          dealerName={dealerName}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'wholesale' && (
        <B2BWholesaleFloor
          dealerCars={dealerCars}
          dealerName={dealerName}
          isVerified={isVerified}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'warranty' && (
        <WarrantyUpsellCalculator
          dealerCars={dealerCars}
          dealerName={dealerName}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'syndication' && (
        <SocialMediaSyndication
          dealerCars={dealerCars}
          dealerName={dealerName}
          dealerPhone={dealerPhone}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'prescreen' && (
        <BuyerDbrPrescreener
          dealerCars={dealerCars}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'watchdog' && (
        <CompetitorWatchdog
          dealerCars={dealerCars}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'scorecard' && (
        <DealerFinancialScorecard
          dealerCars={dealerCars}
          dealerName={dealerName}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
