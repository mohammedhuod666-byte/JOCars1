/**
 * Auto-Financing Pre-Approval & Installment Engine (تجهيز التمويل البنكي للزبون)
 * 
 * Computes buyer eligibility according to Central Bank of Jordan DBR limits,
 * required down payments, and estimated monthly payments across Islamic and Commercial banks.
 */

export interface FinancingInput {
  vehiclePriceJod: number;
  downPaymentJod?: number;
  downPaymentPercent?: number; // e.g. 25%
  loanTenureYears?: number; // 3, 4, 5, 6, 7 (default 5)
  buyerMonthlySalaryJod?: number;
  buyerMonthlyDebtJod?: number; // existing commitments
}

export interface BankProgram {
  bankNameAr: string;
  bankType: 'ISLAMIC' | 'COMMERCIAL';
  estimatedProfitRatePercent: number; // Flat annual rate e.g. 4.9%
  maxTenureYears: number;
  minDownPaymentPercent: number;
  requiresSalaryTransfer: boolean;
  notesAr: string;
}

export interface FinancingResult {
  vehiclePriceJod: number;
  downPaymentJod: number;
  downPaymentPercent: number;
  financeAmountJod: number;
  tenureYears: number;
  totalProfitJod: number;
  totalPayableJod: number;
  estimatedMonthlyInstallmentJod: number;
  buyerEligibility: {
    isEligible: boolean;
    dbrPercent: number | null; // Debt Burden Ratio (Max 50-55% in Jordan)
    maxAllowedInstallmentJod: number | null;
    statusLabelAr: string;
    adviceAr: string;
  };
  recommendedBanks: {
    bankNameAr: string;
    programTypeAr: string;
    monthlyInstallmentJod: number;
    notesAr: string;
  }[];
}

export const JORDAN_AUTO_BANKS: BankProgram[] = [
  {
    bankNameAr: 'البنك الإسلامي الأردني',
    bankType: 'ISLAMIC',
    estimatedProfitRatePercent: 4.85,
    maxTenureYears: 7,
    minDownPaymentPercent: 20,
    requiresSalaryTransfer: true,
    notesAr: 'مرابحة إسلامية متوافقة مع الشريعة، متساهل في سيارات الهايبرد والكهرباء.',
  },
  {
    bankNameAr: 'بنك صفوة الإسلامي',
    bankType: 'ISLAMIC',
    estimatedProfitRatePercent: 4.95,
    maxTenureYears: 7,
    minDownPaymentPercent: 20,
    requiresSalaryTransfer: false,
    notesAr: 'تمويل سريع للمهنيين وأصحاب السجلات التجارية بدون اشتراط تحويل راتب.',
  },
  {
    bankNameAr: 'كابيتال بنك (Capital Bank)',
    bankType: 'COMMERCIAL',
    estimatedProfitRatePercent: 5.25,
    maxTenureYears: 6,
    minDownPaymentPercent: 15,
    requiresSalaryTransfer: false,
    notesAr: 'برامج تمويل مرنة تشمل تأمين شامل مجاني وسرعة موافقة خلال 24 ساعة.',
  },
  {
    bankNameAr: 'شركة بندار للتمويل والتأجير',
    bankType: 'ISLAMIC',
    estimatedProfitRatePercent: 6.25,
    maxTenureYears: 5,
    minDownPaymentPercent: 25,
    requiresSalaryTransfer: false,
    notesAr: 'مناسبة للزبائن غير الحاصلين على تحويل راتب أو الموظفين الجدد.',
  },
];

export function calculateFinancingPreApproval(input: FinancingInput): FinancingResult {
  const price = Math.max(1000, Math.round(input.vehiclePriceJod));
  const tenure = input.loanTenureYears || 5;

  let downPayment = input.downPaymentJod;
  if (downPayment === undefined) {
    const downPct = input.downPaymentPercent || 25;
    downPayment = Math.round((price * (downPct / 100)) / 50) * 50;
  }
  downPayment = Math.min(price - 500, Math.max(500, downPayment));
  const downPaymentPercent = Math.round((downPayment / price) * 100);

  const financeAmountJod = price - downPayment;

  // Average Islamic Murabaha profit rate in Jordan ~4.9% flat
  const flatRate = 0.049;
  const totalProfitJod = Math.round(financeAmountJod * flatRate * tenure);
  const totalPayableJod = financeAmountJod + totalProfitJod;
  const months = tenure * 12;
  const estimatedMonthlyInstallmentJod = Math.round(totalPayableJod / months);

  // Buyer Eligibility check based on Jordan CBJ DBR (Debt Burden Ratio)
  let isEligible = true;
  let dbrPercent: number | null = null;
  let maxAllowedInstallmentJod: number | null = null;
  let statusLabelAr = 'مؤهل مبدئياً للتمويل';
  let adviceAr = `الدفعة الأولى المطلوبة (${downPayment.toLocaleString()} د.أ) والقسط الشهري التقديري (${estimatedMonthlyInstallmentJod.toLocaleString()} د.أ) لمدة (${tenure} سنوات).`;

  if (input.buyerMonthlySalaryJod && input.buyerMonthlySalaryJod > 0) {
    const salary = input.buyerMonthlySalaryJod;
    const existingDebt = input.buyerMonthlyDebtJod || 0;
    // Central Bank of Jordan limit is 50% of net income
    maxAllowedInstallmentJod = Math.max(0, Math.round(salary * 0.50 - existingDebt));
    dbrPercent = Math.round(((existingDebt + estimatedMonthlyInstallmentJod) / salary) * 100);

    if (dbrPercent > 50 || estimatedMonthlyInstallmentJod > maxAllowedInstallmentJod) {
      isEligible = false;
      statusLabelAr = 'تنبيه: يتجاوز عبء المديونية المسموح (DBR > 50%)';
      const neededDownpayment = Math.round(
        price - ((maxAllowedInstallmentJod * months) / (1 + flatRate * tenure))
      );
      adviceAr = `قسط السيارة (${estimatedMonthlyInstallmentJod} د.أ) يتجاوز الحد الأقصى المسموح لراتب الزبون (${maxAllowedInstallmentJod} د.أ). ليتأهل الزبون، يجب زيادة الدفعة الأولى لتصبح (${Math.max(downPayment + 500, neededDownpayment).toLocaleString()} د.أ) أو إدخال كفيل معتمد.`;
    } else {
      statusLabelAr = 'مؤهل ائتمانياً بنسبة ممتازة (DBR سليم)';
      adviceAr = `دخل الزبون الشهري يغطي القسط بسهولة (${dbrPercent}% من الراتب)، ويسهل استصدار موافقة بنكية سريعة خلال 24-48 ساعة.`;
    }
  }

  const recommendedBanks = JORDAN_AUTO_BANKS.map((b) => {
    const pProfit = Math.round(financeAmountJod * (b.estimatedProfitRatePercent / 100) * tenure);
    const mInstallment = Math.round((financeAmountJod + pProfit) / months);
    return {
      bankNameAr: b.bankNameAr,
      programTypeAr: b.bankType === 'ISLAMIC' ? 'مرابحة إسلامية' : 'قرض سيارات تجاري',
      monthlyInstallmentJod: mInstallment,
      notesAr: b.notesAr,
    };
  });

  return {
    vehiclePriceJod: price,
    downPaymentJod: downPayment,
    downPaymentPercent,
    financeAmountJod,
    tenureYears: tenure,
    totalProfitJod,
    totalPayableJod,
    estimatedMonthlyInstallmentJod,
    buyerEligibility: {
      isEligible,
      dbrPercent,
      maxAllowedInstallmentJod,
      statusLabelAr,
      adviceAr,
    },
    recommendedBanks,
  };
}
