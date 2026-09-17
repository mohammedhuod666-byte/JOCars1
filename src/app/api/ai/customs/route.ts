import { NextRequest } from 'next/server';
import { chatCompletionJSON, type ChatMessage } from '@/ai/nvidia-client';
import { successResponse, errorResponse } from '@/lib/api';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { authenticateRequest } from '@/lib/auth';

interface CustomsResult {
  customsDuty: number;
  registrationFee: number;
  licensingFee: number;
  totalFees: number;
  totalCarCost: number;
  annualLicensing: number;
  customsRate: number;
  depreciatedValue: number;
  breakdown: {
    cifValue: number;
    customsBase: number;
    specialTax: number;
    vat: number;
    note: string;
  };
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return errorResponse('تسجيل الدخول مطلوب لاستخدام التحليل الذكي', 401);
  const rateLimit = checkRateLimit(`ai-customs:${user.id}`, RATE_LIMITS.AI);
  if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح', 429);

  const body = await request.json();
  const { year, engineCapacity, price, fuelType, condition, isFreeZone } = body;

  try {

    if (!year || !price) {
      return errorResponse('سنة الصنع والسعر مطلوبان');
    }

    const fallback = calculateLocal(year, engineCapacity, price, fuelType, Boolean(isFreeZone));
    return successResponse(fallback);
  } catch (error) {
    console.error('Customs calculation error:', error);
    const fallback = calculateLocal(
      body.year, body.engineCapacity, body.price, body.fuelType, Boolean(body.isFreeZone)
    );
    return successResponse(fallback);
  }
}

function calculateLocal(
  year: number, engineCapacity: number | undefined, price: number, fuelType?: string, isFreeZone: boolean = false
): CustomsResult {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - year);
  const cc = engineCapacity || 2000;
  const isEV = fuelType === 'ELECTRIC' || fuelType === 'electric' || fuelType === 'EV';
  const isHybrid = fuelType === 'HYBRID' || fuelType === 'hybrid' || fuelType === 'PLUGIN_HYBRID';

  // Age depreciation allowance in Jordan (5% per year max 25%)
  const depreciationFactor = Math.max(0.75, 1 - age * 0.05);
  const depreciatedValue = Math.round(price * depreciationFactor);

  let specialTaxRate = 0;
  let customsRate = 0.05; // Standard 5% basic customs duty
  let annualLicensing = 120;
  let specialTax = 0;

  if (isEV) {
    // EV Jordan Tariffs — flat 27% special tax (amended June 2025)
    specialTaxRate = 0.27;
    annualLicensing = 80;
  } else if (isHybrid) {
    // Hybrid Jordan Tariffs — flat 39% special tax (amended June 2025)
    specialTaxRate = 0.39;
    annualLicensing = cc <= 2000 ? 130 : 250;
  } else {
    // Petrol / Diesel Jordan Tariffs — flat 51% special tax (amended June 2025)
    specialTaxRate = 0.51;
    annualLicensing = 120;
  }

  const customsDuty = Math.round(depreciatedValue * customsRate);
  specialTax = Math.round((depreciatedValue + customsDuty) * specialTaxRate);
  const vat = Math.round((depreciatedValue + customsDuty + specialTax) * 0.16); // 16% sales tax
  const registrationFee = 150; // Plate issuance & compulsory insurance

  const totalFees = customsDuty + specialTax + vat + registrationFee + annualLicensing;
  const totalCarCost = isFreeZone ? price + totalFees : price + annualLicensing;

  const noteText = !isFreeZone
    ? 'السيارة مجمركة ومترخصة جاهزة في الأردن. الرسوم المعروضة تبيّن التكلفة التقديرية للترخيص السنوي وتخمين الجمارك الأصلي.'
    : 'السيارة في المنطقة الحرة بالزرقاء. التكلفة الإجمالية تشمل الجمارك والضريبة الخاصة ورسوم التسجيل والترخيص للمرة الأولى.';

  return {
    customsDuty,
    registrationFee,
    licensingFee: annualLicensing,
    totalFees,
    totalCarCost,
    annualLicensing,
    customsRate: specialTaxRate + customsRate,
    depreciatedValue,
    breakdown: {
      cifValue: depreciatedValue,
      customsBase: customsDuty,
      specialTax,
      vat,
      note: noteText,
    },
  };
}
