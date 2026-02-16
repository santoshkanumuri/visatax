import React from 'react';
import { ChevronRight } from 'lucide-react';

interface MobileSummaryBarProps {
  totalRefundOrOwe: number;
  onOpenReview: () => void;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(value));

export const MobileSummaryBar: React.FC<MobileSummaryBarProps> = ({ totalRefundOrOwe, onOpenReview }) => {
  const isRefund = totalRefundOrOwe >= 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden no-print">
      <button
        onClick={onOpenReview}
        className={`w-full px-4 py-3 flex items-center justify-between ${
          isRefund ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}
      >
        <div className="text-left">
          <p className="text-[10px] uppercase tracking-wide opacity-90">{isRefund ? 'Estimated Refund' : 'Estimated Owe'}</p>
          <p className="text-lg font-bold">{formatCurrency(totalRefundOrOwe)}</p>
        </div>
        <div className="inline-flex items-center gap-1 text-sm font-medium">
          Review
          <ChevronRight size={16} />
        </div>
      </button>
    </div>
  );
};
