"use client";

import { useState } from "react";
import { ReceiptDetailsDialog } from "./receipt-details-dialog";

interface ReceiptLinkProps {
  receiptNumber: string;
  businessUnit?: string;
  className?: string;
}

export function ReceiptLink({ receiptNumber, businessUnit, className = "" }: ReceiptLinkProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  console.log('🔗 ReceiptLink rendered:', { receiptNumber, businessUnit, hasBusinessUnit: !!businessUnit });

  // If no business unit provided, we can't open the dialog
  if (!businessUnit) {
    console.warn('⚠️ No business unit provided for receipt:', receiptNumber);
    return <span className={className}>{receiptNumber}</span>;
  }

  return (
    <>
      <button
        onClick={() => {
          console.log('🖱️ Receipt link clicked:', { receiptNumber, businessUnit });
          setDialogOpen(true);
        }}
        className={`text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium ${className}`}
        type="button"
      >
        {receiptNumber}
      </button>
      <ReceiptDetailsDialog
        receiptId={receiptNumber}
        businessUnit={businessUnit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
