'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
// Header/Footer removed: this component renders inside LayoutWrapper, which
// already mounts both — the local copies produced a duplicated footer and a
// second fixed header stacked on the first one (visible on mobile).
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Car, DollarSign, Eye, Heart, Plus, MessageCircle, ShieldCheck, MapPin, Share2,
  ArrowUpRight, CheckCircle2, Settings, Image as ImageIcon, Camera, Search, Copy,
  Phone, X, Save, Loader2, Trophy, TrendingUp, ChevronDown, Star, Users, FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import { DealerIntelligenceSuite } from './DealerIntelligenceSuite';

interface DealerCar {
  id: string;
  slug: string;
  price: number;
  year: number;
  status: string;
  featured: boolean;
  createdAt?: string;
  brand: { nameAr: string };
  model: { nameAr: string };
  city: { nameAr: string };
  images: { url: string }[];
  views: number;
  inspectionCenter?: string | null;
  inspectionDate?: string | null;
  inspectionVerified?: boolean;
  saves: number;
  inquiries: number;
}

type UploadTarget = 'cover' | 'avatar' | 'logo' | null;

export function DealerDashboardComponent() {
  const { user, token, isAuthenticated, _hydrated, updateUser } = useAuth();
  const authLoading = !_hydrated;
  const [cars, setCars] = useState<DealerCar[]>([]);
  const [loading, setLoading] = useState(true);

  // Showroom identity state
  const [dealerName, setDealerName] = useState('');
  const [dealerAddress, setDealerAddress] = useState('');
  const [dealerDescription, setDealerDescription] = useState('');
  const [dealerPhone, setDealerPhone] = useState('');
  const [commercialReg, setCommercialReg] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState<UploadTarget>(null);

  // Inventory controls
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'APPROVED' | 'SOLD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'new' | 'priceAsc' | 'priceDesc' | 'views'>('new');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trader verification request state
  const [verifyStatus, setVerifyStatus] = useState<{ status: string; rejectReason?: string | null } | null>(null);
  const [verifySending, setVerifySending] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    setDealerName(user.dealerName || user.name || '');
    setDealerAddress(user.dealerAddress || 'الأردن');
    setDealerDescription(user.dealerDescription || '');
    setDealerPhone(user.phone || '');
    setCommercialReg(user.dealerCommercialReg || '');
    setBannerUrl(user.dealerBannerImage || '');
    setAvatarUrl(user.image || '');
    setLogoUrl(user.dealerLogo || '');

    // NOTE: /api/cars/my is the correct endpoint (my-cars does not exist)
    fetch('/api/cars/my', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setCars(data.data.map((c: any) => ({
            id: c.id,
            slug: c.slug,
            price: c.price || 0,
            year: c.year,
            status: c.status,
            featured: !!c.featured,
            createdAt: c.createdAt,
            brand: c.brand || { nameAr: '' },
            model: c.model || { nameAr: '' },
            city: c.city || { nameAr: 'الأردن' },
            images: c.images || [],
            views: c._count?.carViews ?? c.views ?? 0,
            saves: c._count?.favorites ?? c.saves ?? 0,
            inquiries: c._count?.messages ?? 0,
            inspectionCenter: c.inspectionCenter || null,
            inspectionDate: c.inspectionDate || null,
            inspectionVerified: !!c.inspectionVerified,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Verification request status (traders must request; admin approves)
    fetch('/api/trader/verification', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.request) {
          setVerifyStatus({ status: data.data.request.status, rejectReason: data.data.request.rejectReason });
        }
      })
      .catch(() => {});

    // Leads: recent conversations where I'm the seller
    setLeadsLoading(true);
    fetch('/api/conversations', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const mine = data.data
            .filter((c: any) => c.sellerId === user?.id || c.seller?.id === user?.id)
            .slice(0, 8);
          setLeads(mine);
        }
      })
      .catch(() => {})
      .finally(() => setLeadsLoading(false));
  }, [isAuthenticated, user?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Auth headers from the persisted login token (survives even if the
  // HttpOnly cookie expired — the server accepts Bearer tokens too).
  const authHeaders = (json = false): HeadersInit => {
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (json) h['Content-Type'] = 'application/json';
    return h;
  };

  // ── Image uploads (cover / avatar / logo) ──────────────────────────────
  const handleFileUpload = async (file: File, target: Exclude<UploadTarget, null>) => {
    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة فقط');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('حجم الصورة يتجاوز 10MB');
      return;
    }
    setUploading(target);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', headers: authHeaders(), body: fd });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'فشل رفع الصورة');
        return;
      }
      const url: string = data.data.url;
      const field = target === 'cover' ? 'dealerBannerImage' : target === 'avatar' ? 'image' : 'dealerLogo';
      // Auto-save immediately so the storefront updates at once
      const saveRes = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ [field]: url }),
      });
      const saveData = await saveRes.json();
      if (saveData.success) {
        if (target === 'cover') setBannerUrl(url);
        if (target === 'avatar') { setAvatarUrl(url); updateUser({ image: url }); }
        if (target === 'logo') { setLogoUrl(url); updateUser({ dealerLogo: url }); }
        if (target === 'cover') updateUser({ dealerBannerImage: url });
        showToast(
          target === 'cover' ? 'تم تحديث غلاف المعرض!'
          : target === 'avatar' ? 'تم تحديث صورتك الشخصية!'
          : 'تم تحديث شعار المعرض!'
        );
      } else {
        showToast('تم الرفع لكن فشل الحفظ');
      }
    } catch {
      showToast('حدث خطأ أثناء الرفع');
    }
    setUploading(null);
  };

  // ── Text profile save ──────────────────────────────────────────────────
  const handleSaveDealerProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({
          dealerName,
          dealerAddress,
          dealerDescription,
          phone: dealerPhone,
          dealerCommercialReg: commercialReg,
          dealerBannerImage: bannerUrl || undefined,
          dealerLogo: logoUrl || undefined,
          image: avatarUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        updateUser({
          dealerName, dealerAddress, dealerDescription,
          phone: dealerPhone, dealerCommercialReg: commercialReg,
          dealerBannerImage: bannerUrl, dealerLogo: logoUrl, image: avatarUrl,
        });
        showToast('تم حفظ بيانات المعرض بنجاح!');
        setEditingProfile(false);
      } else {
        showToast('فشل حفظ البيانات');
      }
    } catch {
      showToast('فشل حفظ البيانات');
    }
    setSavingProfile(false);
  };

  // Leads (conversations on my cars)
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // CSV bulk import
  const [csvUploading, setCsvUploading] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Story publisher (24h showroom story)
  const [storyCaption, setStoryCaption] = useState('');
  const [storyCarId, setStoryCarId] = useState('');
  const [storyPublishing, setStoryPublishing] = useState(false);
  const storyInputRef = useRef<HTMLInputElement>(null);

  const handleStoryPublish = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('اختر صورة فقط'); return; }
    setStoryPublishing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await fetch('/api/upload', { method: 'POST', headers: authHeaders(), body: fd });
      const upData = await up.json();
      if (!upData.success) { showToast(upData.error || 'فشل رفع الصورة'); return; }
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ imageUrl: upData.data.url, caption: storyCaption, carId: storyCarId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setStoryCaption(''); setStoryCarId('');
        showToast('تم نشر الستوري لمدة 24 ساعة!');
      } else showToast(data.error || 'فشل النشر');
    } catch {
      showToast('حدث خطأ أثناء النشر');
    }
    setStoryPublishing(false);
  };

  // ── Trader verification request ────────────────────────────────────
  const handleVerificationRequest = async () => {
    setVerifySending(true);
    try {
      const res = await fetch('/api/trader/verification', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ notes: verifyNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyStatus({ status: 'PENDING' });
        setShowVerifyForm(false);
        setVerifyNotes('');
        showToast('تم إرسال طلب التوثيق للإدارة!');
      } else {
        showToast(data.error || 'فشل إرسال الطلب');
      }
    } catch {
      showToast('حدث خطأ أثناء إرسال الطلب');
    }
    setVerifySending(false);
  };

  // ── Inventory actions ──────────────────────────────────────────────────
  const handleSavePrice = async (carId: string) => {
    const newPrice = parseInt(editingPriceVal, 10);
    if (isNaN(newPrice) || newPrice <= 0) {
      showToast('أدخل سعراً صحيحاً');
      return;
    }
    try {
      // NOTE: the API exposes PUT (not PATCH) for owner price updates
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ price: newPrice }),
      });
      const data = await res.json();
      if (data.success) {
        setCars(prev => prev.map(c => c.id === carId ? { ...c, price: newPrice } : c));
        setEditingPriceId(null);
        showToast('تم تحديث السعر بنجاح!');
      } else {
        showToast('فشل تحديث السعر');
      }
    } catch {
      showToast('حدث خطأ أثناء تحديث السعر');
    }
  };

  const handleToggleSold = async (carId: string, currentStatus: string) => {
    const toSold = currentStatus !== 'SOLD';
    // Dedicated endpoints: POST /sold marks SOLD, POST /reactivate restores APPROVED
    const endpoint = toSold ? `/api/cars/${carId}/sold` : `/api/cars/${carId}/reactivate`;
    let payload: Record<string, unknown> = {};
    if (toSold) {
      // Ask for the actual transacted price (feeds the sold-price archive)
      const car = cars.find(c => c.id === carId);
      const answer = prompt(`بكم بعت السيارة فعلياً؟ (السعر المعلن: ${(car?.price || 0).toLocaleString('ar-JO')} د.أ)\nاتركه فارغاً لاستخدام السعر المعلن:`, '');
      if (answer === null) return; // cancelled
      const num = parseInt((answer || '').replace(/[^0-9]/g, ''), 10);
      if (answer.trim() && (isNaN(num) || num <= 0)) { showToast('سعر غير صالح'); return; }
      if (!isNaN(num) && num > 0) payload.soldPrice = num;
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        const nextStatus = toSold ? 'SOLD' : 'APPROVED';
        setCars(prev => prev.map(c => c.id === carId ? { ...c, status: nextStatus } : c));
        showToast(toSold ? 'تم تمييز السيارة كمباعة! ' : 'تمت إعادة السيارة للعرض!');
      } else {
        showToast(data.error || 'فشل تغيير الحالة');
      }
    } catch {
      showToast('حدث خطأ أثناء تغيير الحالة');
    }
  };

  const handleFeatureRequest = async (car: DealerCar) => {
    if (!confirm(`طلب تمييز إعلان ${car.brand?.nameAr} ${car.model?.nameAr} ${car.year} ؟\nستتم مراجعة طلبك من الإدارة وتفعيل التمييز بعد تأكيد الدفع.`)) return;
    try {
      const res = await fetch('/api/premium-requests', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ carId: car.id, type: 'FEATURE' }),
      });
      const data = await res.json();
      if (data.success) showToast('تم إرسال طلب التمييز! ستتواصل معك الإدارة');
      else showToast(data.error || 'فشل إرسال الطلب');
    } catch {
      showToast('حدث خطأ أثناء إرسال الطلب');
    }
  };

  const handleDeclareInspection = async (car: DealerCar) => {    const center = prompt('اسم مركز الفحص المعتمد (مثال: مركز عمان لفحص السيارات):', (car as any).inspectionCenter || '');
    if (center === null) return;
    const dateStr = prompt('تاريخ الفحص (YYYY-MM-DD):', (car as any).inspectionDate ? new Date((car as any).inspectionDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    if (dateStr === null) return;
    try {
      const res = await fetch(`/api/cars/${car.id}`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ inspectionCenter: center, inspectionDate: dateStr }),
      });
      const data = await res.json();
      if (data.success) {
        setCars(prev => prev.map(c => c.id === car.id ? { ...c, inspectionCenter: center, inspectionDate: dateStr } as DealerCar : c));
        showToast('تم حفظ بيانات الفحص — بانتظار اعتماد الإدارة للشارة');
      } else {
        showToast(data.error || 'فشل الحفظ');
      }
    } catch {
      showToast('حدث خطأ أثناء الحفظ');
    }
  };

  const handleCopyStoreLink = async () => {    const url = `${window.location.origin}/profile/${user?.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('تم نسخ رابط المعرض!');
    } catch {
      showToast(url);
    }
  };

  const handleShareWhatsApp = () => {
    const url = `${window.location.origin}/profile/${user?.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`تفضلوا بزيارة معرض ${dealerName || ''} للسيارات \n${url}`)}`, '_blank');
  };

  // ── CSV bulk import (up to 50 cars per file) ──────────────────────────
  const handleTemplateDownload = () => {
    const header = 'brand,model,year,price,kilometers,fuelType,phone,city,color,description';
    const example = 'تويوتا,كامري,2020,16500,90000,HYBRID,0791234567,عمان,أبيض,فل كامل فحص 7 جيد';
    const blob = new Blob(['\ufeff' + header + '\n' + example], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cars-import-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const parseCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch ===',' && !inQuotes) {
        out.push(cur.trim()); cur = '';
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  const handleCsvFile = async (file: File) => {
    setCsvUploading(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { showToast('الملف فارغ — أضف صفوف سيارات'); return; }
      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
      const rows = lines.slice(1, 51).map(line => {
        const vals = parseCsvLine(line);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return {
          brand: obj.brand, model: obj.model, year: obj.year, price: obj.price,
          kilometers: obj.kilometers, fuelType: obj.fueltype || obj.fuel_type || obj.fuel || 'PETROL',
          phone: obj.phone, city: obj.city, color: obj.color, description: obj.description,
        };
      });
      const res = await fetch('/api/cars/bulk-import', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ cars: rows }),
      });
      const data = await res.json();
      if (data.success) {
        const { created, failed, errors } = data.data;
        showToast(`تم استيراد ${created} سيارة ${failed ? ` — فشل ${failed}` : ''}`);
        if (errors && errors.length > 0) {
          console.warn('Bulk import row errors:', errors);
        }
        setTimeout(() => window.location.reload(), 1800);
      } else {
        showToast(data.error || 'فشل الاستيراد');
      }
    } catch {
      showToast('تعذر قراءة الملف');
    }
    setCsvUploading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center items-center">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const totalCars = cars.length;
  const activeCars = cars.filter(c => c.status === 'APPROVED').length;
  const soldCars = cars.filter(c => c.status === 'SOLD').length;
  const totalStockWorth = cars.filter(c => c.status !== 'SOLD').reduce((acc, c) => acc + (c.price || 0), 0);
  const totalViews = cars.reduce((acc, c) => acc + (c.views || 0), 0);
  const totalSaves = cars.reduce((acc, c) => acc + (c.saves || 0), 0);
  const totalInquiries = cars.reduce((acc, c) => acc + (c.inquiries || 0), 0);
  const avgPrice = activeCars > 0 ? Math.round(cars.filter(c => c.status === 'APPROVED').reduce((a, c) => a + (c.price || 0), 0) / activeCars) : 0;
  const topCar = cars.length > 0 ? [...cars].sort((a, b) => (b.views || 0) - (a.views || 0))[0] : null;
  const maxViews = topCar?.views || 1;

  const filteredCars = cars
    .filter(c => {
      if (selectedFilter === 'APPROVED') return c.status === 'APPROVED';
      if (selectedFilter === 'SOLD') return c.status === 'SOLD';
      return true;
    })
    .filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim();
      return `${c.brand?.nameAr} ${c.model?.nameAr} ${c.year}`.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'priceDesc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      return 0; // 'new' — API already returns newest first
    });

  const storeUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${user?.id}` : '';

  const statCards = [
    { label: 'قيمة المخزون المعروض', value: `${totalStockWorth.toLocaleString('ar-JO')} د.أ`, sub: `متوسط ${avgPrice.toLocaleString('ar-JO')} د.أ`, icon: DollarSign, theme: 'emerald' },
    { label: 'مشاهدات الإعلانات', value: totalViews.toLocaleString('ar-JO'), sub: 'مشاهدات الزوار', icon: Eye, theme: 'blue' },
    { label: 'مرات الحفظ بالمفضلة', value: totalSaves.toLocaleString('ar-JO'), sub: 'اهتمام المشترين', icon: Heart, theme: 'pink' },
    { label: 'استفسارات المشترين', value: totalInquiries.toLocaleString('ar-JO'), sub: 'رسائل على إعلاناتك', icon: MessageCircle, theme: 'purple' },
    { label: 'إعلانات نشطة', value: `${activeCars} / ${totalCars}`, sub: 'سيارات متاحة الآن', icon: Car, theme: 'teal' },
    { label: 'سيارات مباعة', value: `${soldCars} مباعة`, sub: 'عمليات بيع ناجحة', icon: CheckCircle2, theme: 'amber' },
  ];

  const themeStyles: Record<string, string> = {
    emerald: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    blue: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400',
    pink: 'from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200 dark:border-pink-500/20 text-pink-600 dark:text-pink-400',
    purple: 'from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400',
    teal: 'from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-200 dark:border-teal-500/20 text-teal-600 dark:text-teal-400',
    amber: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
      <main className="container-custom max-w-6xl mx-auto px-4 py-8 flex-1">

        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-xl text-sm font-bold flex items-center gap-2 max-w-[90vw]"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file inputs */}
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'cover'); e.target.value = ''; }} />
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'avatar'); e.target.value = ''; }} />
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'logo'); e.target.value = ''; }} />

        {/* ── Showroom Hero ─────────────────────────────────────────── */}
        <div className="card overflow-hidden mb-6 border border-emerald-500/20 shadow-xl">
          <div className="relative h-48 sm:h-64 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 overflow-hidden group">
            {bannerUrl ? (
              <img src={bannerUrl} alt="غلاف المعرض" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Store className="w-40 h-40 text-emerald-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading !== null}
              className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              {uploading === 'cover' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {uploading === 'cover' ? 'جاري رفع الغلاف...' : 'تغيير صورة الغلاف'}
            </button>
          </div>

          <div className="p-6 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-20 sm:-mt-24">
              <div className="flex items-center gap-4 min-w-0">
                {/* Avatar with upload */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-2xl flex items-center justify-center text-3xl font-black text-emerald-600 dark:text-emerald-400 overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{dealerName.charAt(0) || 'D'}</span>
                    )}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploading !== null}
                    title="تغيير الصورة الشخصية"
                    className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition-all"
                  >
                    {uploading === 'avatar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                </div>
                <div className="pt-14 sm:pt-16 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white break-words min-w-0">{dealerName || 'معرض السيارات'}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                      user?.dealerVerified
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" /> {user?.dealerVerified ? 'تاجر معتمد' : 'تاجر مسجل'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {dealerAddress}
                  </p>
                  {dealerDescription && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-md">{dealerDescription}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                <Link href="/cars/add" className="btn btn-emerald px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                  <Plus className="w-4 h-4" /> إضافة سيارة
                </Link>
                <Link href={`/profile/${user?.id}`} className="btn btn-outline px-4 py-2.5 text-xs font-bold">
                  معاينة المعرض العام
                </Link>
                <Link href="/dealer/reports" className="btn btn-outline px-4 py-2.5 text-xs font-bold">
                  تقرير الأداء 
                </Link>
              </div>
            </div>

            {/* Quick share row */}
            <div className="mt-5 flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <Share2 className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 truncate flex-1 min-w-[180px]" dir="ltr">{storeUrl}</span>
              <button onClick={handleCopyStoreLink} className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-xs font-bold flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all">
                <Copy className="w-3.5 h-3.5" /> نسخ الرابط
              </button>
              <button onClick={handleShareWhatsApp} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 transition-all">
                <Share2 className="w-3.5 h-3.5" /> مشاركة واتساب
              </button>
              <button onClick={() => setEditingProfile(!editingProfile)} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition-all">
                <Settings className="w-3.5 h-3.5" /> إعدادات المعرض
              </button>
              <button onClick={handleTemplateDownload} className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-xs font-bold flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all" title="تنزيل قالب CSV للاستيراد الجماعي">
                <FileSpreadsheet className="w-3.5 h-3.5" /> قالب CSV
              </button>
              <button onClick={() => csvInputRef.current?.click()} disabled={csvUploading} className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-purple-700 transition-all" title="استيراد حتى 50 سيارة دفعة واحدة">
                {csvUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                {csvUploading ? 'جاري الاستيراد...' : 'استيراد CSV'}
              </button>
              <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); e.target.value = ''; }} />
            </div>

            {/* Trader verification banner — new traders start UNVERIFIED and must request */}
            {!user?.dealerVerified ? (
              <div className="mt-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5">
                {verifyStatus?.status === 'PENDING' ? (
                  <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    طلب التوثيق قيد مراجعة الإدارة  — سيتم إشعارك عند الاعتماد
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-sm">
                        <p className="font-bold text-amber-700 dark:text-amber-300">حسابك غير موثّق — وثّق معرضك لزيادة ثقة المشترين </p>
                        {verifyStatus?.status === 'REJECTED' && verifyStatus?.rejectReason && (
                          <p className="text-xs text-red-500 mt-1">سبب الرفض السابق: {verifyStatus.rejectReason}</p>
                        )}
                        <p className="text-[11px] text-gray-500 mt-0.5">أرسل طلب توثيق مع بيانات معرضك وسيتم مراجعته من الإدارة</p>
                      </div>
                      <button onClick={() => setShowVerifyForm(!showVerifyForm)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all">
                        <ShieldCheck className="w-4 h-4" />
                        {verifyStatus?.status === 'REJECTED' ? 'إعادة إرسال طلب التوثيق' : 'طلب توثيق الحساب'}
                      </button>
                    </div>
                    {showVerifyForm && (
                      <div className="mt-3 space-y-2">
                        <textarea value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} rows={2}
                          placeholder="ملاحظات للإدارة (اختياري): السجل التجاري، العنوان التفصيلي، سنوات الخبرة..."
                          className="input text-sm" />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setShowVerifyForm(false)} className="px-4 py-2 rounded-xl text-xs bg-gray-200 dark:bg-gray-800">إلغاء</button>
                          <button onClick={handleVerificationRequest} disabled={verifySending}
                            className="btn btn-emerald px-5 py-2 text-xs font-bold flex items-center gap-1.5">
                            {verifySending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            {verifySending ? 'جاري الإرسال...' : 'إرسال الطلب'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> حساب موثّق من الإدارة 
              </div>
            )}

            {/* Settings drawer */}
            <AnimatePresence>
              {editingProfile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-500" /> الهوية البصرية للمعرض
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Logo upload */}
                      <button onClick={() => logoInputRef.current?.click()} disabled={uploading !== null}
                        className="relative rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 transition-all overflow-hidden h-32 bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-1">
                        {logoUrl ? <img src={logoUrl} alt="شعار المعرض" className="w-full h-full object-contain p-2" />
                          : <><Store className="w-8 h-8 text-gray-300" /><span className="text-[11px] text-gray-500 font-bold">شعار المعرض (Logo)</span></>}
                        <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-bold flex items-center gap-1">
                          {uploading === 'logo' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />} تغيير
                        </span>
                      </button>
                      {/* Avatar upload */}
                      <button onClick={() => avatarInputRef.current?.click()} disabled={uploading !== null}
                        className="relative rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 transition-all overflow-hidden h-32 bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-1">
                        {avatarUrl ? <img src={avatarUrl} alt="الصورة الشخصية" className="w-full h-full object-cover" />
                          : <><Camera className="w-8 h-8 text-gray-300" /><span className="text-[11px] text-gray-500 font-bold">الصورة الشخصية</span></>}
                        <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-bold flex items-center gap-1">
                          {uploading === 'avatar' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />} تغيير
                        </span>
                      </button>
                      {/* Cover upload */}
                      <button onClick={() => coverInputRef.current?.click()} disabled={uploading !== null}
                        className="relative rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 transition-all overflow-hidden h-32 bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-1">
                        {bannerUrl ? <img src={bannerUrl} alt="غلاف المعرض" className="w-full h-full object-cover" />
                          : <><ImageIcon className="w-8 h-8 text-gray-300" /><span className="text-[11px] text-gray-500 font-bold">صورة الغلاف (Cover)</span></>}
                        <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-bold flex items-center gap-1">
                          {uploading === 'cover' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />} تغيير
                        </span>
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-1">
                      <Store className="w-4 h-4 text-emerald-500" /> بيانات المعرض
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">اسم المعرض التجاري</label>
                        <input type="text" value={dealerName} onChange={(e) => setDealerName(e.target.value)} className="input text-sm mt-1" placeholder="مثال: معرض الفخامة للسيارات" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">العنوان (المدينة والشارع)</label>
                        <input type="text" value={dealerAddress} onChange={(e) => setDealerAddress(e.target.value)} className="input text-sm mt-1" placeholder="مثال: المنطقة الحرة - الزرقاء" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> رقم هاتف المعرض</label>
                        <input type="text" value={dealerPhone} onChange={(e) => setDealerPhone(e.target.value)} className="input text-sm mt-1" placeholder="07XXXXXXXX" dir="ltr" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">السجل التجاري (اختياري)</label>
                        <input type="text" value={commercialReg} onChange={(e) => setCommercialReg(e.target.value)} className="input text-sm mt-1" placeholder="رقم السجل التجاري" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">وصف المعرض (يظهر للزوار)</label>
                      <textarea value={dealerDescription} onChange={(e) => setDealerDescription(e.target.value)} rows={3} className="input text-sm mt-1" placeholder="اكتب نبذة عن معرضك: تخصصك، خدماتك، ساعات العمل..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingProfile(false)} className="px-4 py-2 rounded-xl text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> إلغاء
                      </button>
                      <button onClick={handleSaveDealerProfile} disabled={savingProfile} className="btn btn-emerald px-5 py-2 text-xs font-bold flex items-center gap-1.5">
                        {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {savingProfile ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Story publisher ─────────────────────────────────────────── */}
        <div className="card p-5 mb-6 border-purple-200 dark:border-purple-500/20">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
             ستوري الوارد الجديد <span className="text-[10px] font-normal text-gray-400">(يظهر بالرئيسية 24 ساعة)</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <input value={storyCaption} onChange={(e) => setStoryCaption(e.target.value)} maxLength={300}
              placeholder="اكتب تعليقاً: وصل حديثاً كامري 2022 فل كامل..."
              className="input text-sm flex-1" />
            <select value={storyCarId} onChange={(e) => setStoryCarId(e.target.value)} className="input text-sm sm:w-52">
              <option value="">بدون ربط سيارة</option>
              {cars.filter(c => c.status === 'APPROVED').map(c => (
                <option key={c.id} value={c.id}>{c.brand?.nameAr} {c.model?.nameAr} {c.year}</option>
              ))}
            </select>
            <button onClick={() => storyInputRef.current?.click()} disabled={storyPublishing}
              className="btn btn-emerald px-5 py-2 text-xs font-bold flex items-center gap-1.5 justify-center">
              {storyPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {storyPublishing ? 'جاري النشر...' : 'اختر صورة وانشر'}
            </button>
            <input ref={storyInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStoryPublish(f); e.target.value = ''; }} />
          </div>
        </div>

        {/* ── Analytics ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {statCards.map((s) => (
            <div key={s.label} className={`card p-4 bg-gradient-to-br border ${themeStyles[s.theme]}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">{s.label}</span>
                <s.icon className="w-4 h-4" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
              <span className="text-[11px] text-gray-500">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* ── Top performer + views chart ───────────────────────────── */}
        {topCar && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="card p-5 border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-500" /> الإعلان الأعلى مشاهدة
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                  <img src={topCar.images[0]?.url || '/images/placeholder-car.svg'} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{topCar.brand?.nameAr} {topCar.model?.nameAr} {topCar.year}</p>
                  <p className="text-xs text-gray-500 mt-0.5"> {topCar.views.toLocaleString('ar-JO')} مشاهدة •  {topCar.saves} حفظ •  {topCar.inquiries} استفسار</p>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{topCar.price.toLocaleString('ar-JO')} د.أ</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> أداء الإعلانات (الأعلى مشاهدة)
              </h3>
              <div className="space-y-2.5">
                {[...cars].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((c) => (
                  <div key={c.id}>
                    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                      <span className="truncate font-bold">{c.brand?.nameAr} {c.model?.nameAr} {c.year}</span>
                      <span className="shrink-0 mr-2">{c.views.toLocaleString('ar-JO')} </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(4, Math.round(((c.views || 0) / maxViews) * 100))}%` }}
                        transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-400" />
                    </div>
                  </div>
                ))}
                {cars.length === 0 && <p className="text-xs text-gray-400">لا توجد بيانات بعد — أضف سيارات لمعرضك.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Leads CRM ─────────────────────────────────────────────── */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" /> العملاء المحتملون
              </h2>
              <p className="text-xs text-gray-500">أحدث المحادثات على إعلاناتك — رد بسرعة لتغلق البيع </p>
            </div>
            <Link href="/messages" className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 text-xs font-bold hover:bg-purple-100 transition-all">
              كل الرسائل
            </Link>
          </div>
          {leadsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
          ) : leads.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">لا توجد محادثات بعد — شارك رابط معرضك لجذب المشترين </p>
          ) : (
            <div className="space-y-2.5">
              {leads.map((c: any) => {
                const peer = c.buyerId === user?.id ? c.seller : c.buyer;
                return (
                  <Link key={c.id} href={`/messages?conversationId=${c.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 hover:border-purple-500/40 transition-all">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                      {peer?.image ? <img src={peer.image} alt="" className="w-full h-full object-cover" /> : (peer?.name?.charAt(0) || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{peer?.name || 'مشترٍ'}</span>
                        {c.unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{c.unreadCount}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {c.car ? ` ${c.car.brand?.nameAr || ''} ${c.car.model?.nameAr || ''} • ` : ''}
                        {c.lastMessage?.content?.slice(0, 60) || 'محادثة جديدة'}
                      </p>
                    </div>
                    <MessageCircle className="w-4 h-4 text-gray-400 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Dealer Intelligence & Trading Suite (رادار الصيد، البدل، الترسيم، الطلب، العروض) ── */}
        <DealerIntelligenceSuite
          dealerCars={cars}
          dealerName={dealerName}
          dealerPhone={dealerPhone}
          dealerLogo={avatarUrl || logoUrl}
          isVerified={Boolean(user?.dealerVerified)}
          onRequestVerification={() => setShowVerifyForm(true)}
          onShowToast={showToast}
        />

        {/* ── Inventory ─────────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">إدارة مخزون المعرض</h2>
                <p className="text-xs text-gray-500">ابحث، رتّب، وحدّث أسعار سياراتك وحالة البيع مباشرة</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedFilter('ALL')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  الكل ({totalCars})
                </button>
                <button onClick={() => setSelectedFilter('APPROVED')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedFilter === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  المتاحة ({activeCars})
                </button>
                <button onClick={() => setSelectedFilter('SOLD')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedFilter === 'SOLD' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  المباعة ({soldCars})
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث بالماركة أو الموديل أو السنة..."
                  className="input text-sm pr-9" />
              </div>
              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="input text-sm pl-8 appearance-none cursor-pointer">
                  <option value="new">الأحدث أولاً</option>
                  <option value="views">الأعلى مشاهدة</option>
                  <option value="priceDesc">السعر: الأعلى أولاً</option>
                  <option value="priceAsc">السعر: الأقل أولاً</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {filteredCars.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">
                {cars.length === 0 ? 'لا توجد سيارات في معرضك حالياً' : 'لا توجد نتائج مطابقة للبحث'}
              </p>
              {cars.length === 0 && (
                <Link href="/cars/add" className="btn btn-emerald px-5 py-2 text-xs mt-3 inline-block font-bold">
                  إضافة أول سيارة للمعرض
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCars.map(car => (
                <div key={car.id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 hover:border-emerald-500/30 transition-all gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                    <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                      <img src={car.images[0]?.url || '/images/placeholder-car.svg'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {car.brand?.nameAr} {car.model?.nameAr} {car.year}
                        </h3>
                        {car.status === 'SOLD' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">مباعة </span>
                        )}
                        {car.featured && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">مميزة </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                        <span> {car.city?.nameAr || 'الأردن'}</span>
                        <span> {car.views} مشاهدة</span>
                        <span> {car.saves} حفظ</span>
                        <span> {car.inquiries} استفسار</span>
                      </div>
                      {editingPriceId === car.id ? (
                        <div className="flex items-center gap-2 mt-1.5">
                          <input type="number" value={editingPriceVal} onChange={(e) => setEditingPriceVal(e.target.value)}
                            className="input text-sm !py-1.5 !px-3 w-36" dir="ltr" autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSavePrice(car.id); if (e.key === 'Escape') setEditingPriceId(null); }} />
                          <button onClick={() => handleSavePrice(car.id)} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">حفظ</button>
                          <button onClick={() => setEditingPriceId(null)} className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-xs font-bold">إلغاء</button>
                        </div>
                      ) : (
                        <p className="font-black text-emerald-600 dark:text-emerald-400 text-base mt-1">
                          {car.price.toLocaleString('ar-JO')} د.أ
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => { setEditingPriceId(car.id); setEditingPriceVal(car.price.toString()); }}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 transition-all flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> تعديل السعر
                    </button>
                    <button
                      onClick={() => handleToggleSold(car.id, car.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        car.status === 'SOLD'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200'
                      }`}
                    >
                      {car.status === 'SOLD' ? 'إعادة للعرض' : 'تمييز كمباعة'}
                    </button>
                                        <button
                      onClick={() => handleDeclareInspection(car)}
                      title={(car as any).inspectionVerified ? `فحص معتمد ${(car as any).inspectionCenter ? `: ${(car as any).inspectionCenter}` : ''}` : 'توثيق الفحص بمركز معتمد'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                        (car as any).inspectionVerified
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                          : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> {(car as any).inspectionVerified ? 'فحص معتمد ' : 'توثيق الفحص'}
                    </button>
                    <button
                      onClick={() => handleFeatureRequest(car)}
                      title="طلب تمييز الإعلان"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-100"
                    >
                      <Star className="w-3.5 h-3.5" /> تمييز 
                    </button>
                    <Link
                      href={`/cars/${car.slug}`} className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-all" title="معاينة الإعلان">
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
