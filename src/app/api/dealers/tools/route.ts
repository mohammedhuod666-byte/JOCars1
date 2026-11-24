import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api';
import { calculateTradeInSwap } from '@/ai/dealers/trade-in-engine';
import { calculateImportToZarqa } from '@/ai/dealers/import-duty-engine';
import { calculateHoldingCost } from '@/ai/dealers/holding-cost-engine';
import { calculateFinancingPreApproval } from '@/ai/dealers/financing-preapproval-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.action) {
      return errorResponse('أدخل نوع العملية المطلوبة (action)', 400);
    }

    const { action, payload } = body;

    switch (action) {
      case 'TRADE_IN': {
        const result = calculateTradeInSwap({
          customerCarPriceEstimated: Number(payload.customerCarPriceEstimated || 15000),
          customerCarYear: Number(payload.customerCarYear || 2018),
          customerCarKm: Number(payload.customerCarKm || 120000),
          condition: payload.condition || 'FOUR_CLEAN',
          showroomCarPrice: Number(payload.showroomCarPrice || 22000),
          dealerTargetMarginPercent: Number(payload.dealerTargetMarginPercent || 12),
        });
        return successResponse(result);
      }

      case 'IMPORT_DUTY': {
        const result = calculateImportToZarqa({
          origin: payload.origin || 'USA_AUCTION',
          purchasePriceForeign: Number(payload.purchasePriceForeign || 18000),
          currency: payload.currency || 'USD',
          fuelType: payload.fuelType || 'HYBRID',
          engineCc: Number(payload.engineCc || 2000),
          targetProfitPercent: Number(payload.targetProfitPercent || 12),
        });
        return successResponse(result);
      }

      case 'HOLDING_COST': {
        const result = calculateHoldingCost({
          carPurchaseCostJod: Number(payload.carPurchaseCostJod || 18000),
          currentAskingPriceJod: Number(payload.currentAskingPriceJod || 20500),
          daysOnLot: Number(payload.daysOnLot || 42),
          dailyFacilityFeeJod: Number(payload.dailyFacilityFeeJod || 3.5),
          annualCostOfCapitalPercent: Number(payload.annualCostOfCapitalPercent || 8),
        });
        return successResponse(result);
      }

      case 'FINANCING': {
        const result = calculateFinancingPreApproval({
          vehiclePriceJod: Number(payload.vehiclePriceJod || 20000),
          downPaymentJod: payload.downPaymentJod ? Number(payload.downPaymentJod) : undefined,
          downPaymentPercent: payload.downPaymentPercent ? Number(payload.downPaymentPercent) : 25,
          loanTenureYears: Number(payload.loanTenureYears || 5),
          buyerMonthlySalaryJod: payload.buyerMonthlySalaryJod ? Number(payload.buyerMonthlySalaryJod) : undefined,
          buyerMonthlyDebtJod: payload.buyerMonthlyDebtJod ? Number(payload.buyerMonthlyDebtJod) : 0,
        });
        return successResponse(result);
      }

      default:
        return errorResponse('عملية غير معتمدة', 400);
    }
  } catch (err: any) {
    return errorResponse(err?.message || 'فشل تنفيذ الحسبة', 500);
  }
}
