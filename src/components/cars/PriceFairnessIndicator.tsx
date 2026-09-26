import { cn } from '@/lib/utils';

interface Props {
  price: number;
  fairPriceEstimate: number | null;
  size?: 'sm' | 'md';
}

function getFairnessInfo(price: number, fairPriceEstimate: number) {
  const diff = ((price - fairPriceEstimate) / fairPriceEstimate) * 100;
  const absDiff = Math.abs(diff);

  let color: string;
  let bg: string;
  let label: string;

  if (diff <= -8) {
    color = 'text-green-700 dark:text-green-400';
    bg = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    label = `أقل بـ ${Math.round(absDiff)}% عن العادل`;
  } else if (diff <= 8) {
    color = 'text-amber-700 dark:text-amber-400';
    bg = 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    label = 'سعر عادل متوافق';
  } else {
    color = 'text-red-700 dark:text-red-400';
    bg = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    label = `أعلى بـ ${Math.round(diff)}% عن العادل`;
  }

  return { color, bg, label };
}

export function PriceFairnessIndicator({ price, fairPriceEstimate, size = 'sm' }: Props) {
  if (!fairPriceEstimate) return null;

  const { color, bg, label } = getFairnessInfo(price, fairPriceEstimate);
  const pClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-0.5' : 'text-xs px-2.5 py-1 gap-1';

  return (
    <span className={cn('inline-flex items-center rounded-full border font-medium', bg, color, pClass)}>
      <span>{label}</span>
    </span>
  );
}

export function PriceFairnessBadge({ price, fairPriceEstimate }: { price: number; fairPriceEstimate: number }) {
  const { bg, color, label } = getFairnessInfo(price, fairPriceEstimate);
  return (
    <span className={cn('inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border', bg, color)}>
      <span>{label}</span>
    </span>
  );
}
