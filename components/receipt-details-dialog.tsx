"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ExternalLink, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceiptDetailsDialogProps {
  receiptId: string;
  businessUnit: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDetailsDialog({
  receiptId,
  businessUnit,
  open,
  onOpenChange,
}: ReceiptDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receiptData, setReceiptData] = useState<any>(null);

  const handleLoad = async () => {
    if (!receiptId || !businessUnit) return;

    setLoading(true);
    setError("");
    setReceiptData(null);

    console.log('🔍 Loading receipt:', { receiptId, businessUnit });

    try {
      const response = await fetch("/api/peoplesoft/query-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessUnit, receiptId }),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || "Failed to query receipt");
      }

      const data = await response.json();
      console.log('✅ Receipt data received:', data);
      setReceiptData(data);
    } catch (err) {
      console.error('💥 Exception:', err);
      setError(err instanceof Error ? err.message : "Failed to query receipt");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load when dialog opens and reset state when closes
  if (open && !receiptData && !loading && !error) {
    handleLoad();
  }

  // Reset state when dialog closes
  if (!open && (receiptData || error)) {
    setReceiptData(null);
    setError("");
  }

  const receipts = receiptData?.data?.query?.rows || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            PeopleSoft Receipt Details
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </DialogTitle>
          <DialogDescription>
            Receipt information from PeopleSoft API - BU: {businessUnit}, Receipt: {receiptId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading receipt details...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && receipts.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No receipt data found in PeopleSoft</AlertDescription>
            </Alert>
          )}

          {receipts.length > 0 && (
            <div className="space-y-6">
              {receipts.map((receipt: any, index: number) => {
                // The API returns fields without "A." prefix
                const receiverId = receipt["RECEIVER_ID"] || receipt["A.RECEIVER_ID"];
                const businessUnitField = receipt["BUSINESS_UNIT"] || receipt["A.BUSINESS_UNIT"];
                const receiptDate = receipt["RECEIPT_DT"] || receipt["A.RECV_DT"] || receipt["A.RECEIPT_DT"];
                const receiptStatus = receipt["RECV_STATUS"] || receipt["A.RECV_STATUS"];
                const invoiceId = receipt["INVOICE_ID"] || receipt["A.INVOICE_ID"];
                const oprid = receipt["OPRID"] || receipt["A.OPRID"];
                const lastUpdate = receipt["LAST_DTTM_UPDATE"] || receipt["A.LAST_DTTM_UPDATE"];
                const modifiedBy = receipt["OPRID_MODIFIED_BY"] || receipt["A.OPRID_MODIFIED_BY"];
                
                // Line-level fields (if available)
                const poId = receipt["PO_ID"] || receipt["A.PO_ID"];
                const lineNbr = receipt["LINE_NBR"] || receipt["A.LINE_NBR"] || receipt["RECV_LN_NBR"] || receipt["A.RECV_LN_NBR"];
                const schedNbr = receipt["SCHED_NBR"] || receipt["A.SCHED_NBR"];
                const itemId = receipt["INV_ITEM_ID"] || receipt["A.INV_ITEM_ID"];
                const descr = receipt["DESCR254_MIXED"] || receipt["A.DESCR254_MIXED"];
                const qtyReceived = parseFloat(receipt["QTY_RCVD"] || receipt["A.QTY_RCVD"]) || 0;
                const unitPrice = parseFloat(receipt["UNIT_PRICE"] || receipt["A.UNIT_PRICE"]) || 0;
                const merchandiseAmt = parseFloat(receipt["MERCHANDISE_AMT"] || receipt["A.MERCHANDISE_AMT"]) || 0;
                
                console.log('📝 Receipt row data:', receipt);

                return (
                  <div key={index} className="border rounded-lg p-6 space-y-4 bg-card">
                    {/* Receipt Header */}
                    <div className="pb-4 border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Receipt #{receiverId || "—"}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {lineNbr && `Line ${lineNbr}`}
                            {schedNbr && ` | Schedule ${schedNbr}`}
                            {receiptStatus && (
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                receiptStatus.includes('Closed') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {receiptStatus}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Business Unit</p>
                          <p className="font-semibold">{businessUnitField || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Receipt Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {poId && (
                        <div>
                          <Label className="text-muted-foreground text-xs">PO ID</Label>
                          <p className="font-medium text-base">{poId}</p>
                        </div>
                      )}
                      {receiptDate && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Receipt Date</Label>
                          <p className="font-medium text-base">
                            {new Date(receiptDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {invoiceId && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Invoice ID</Label>
                          <p className="font-medium text-base">{invoiceId}</p>
                        </div>
                      )}
                    </div>

                    {/* Item Information (if available) */}
                    {(itemId || descr) && (
                      <div className="space-y-3 bg-muted/50 p-4 rounded-md">
                        <h4 className="font-semibold text-sm">Item Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {itemId && (
                            <div>
                              <Label className="text-muted-foreground text-xs">Item ID</Label>
                              <p className="font-medium">{itemId}</p>
                            </div>
                          )}
                          {descr && (
                            <div>
                              <Label className="text-muted-foreground text-xs">Item Description</Label>
                              <p className="font-medium">{descr}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quantity & Pricing (if available) */}
                    {(qtyReceived > 0 || unitPrice > 0 || merchandiseAmt > 0) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {qtyReceived > 0 && (
                          <div className="bg-blue-50 p-3 rounded-md">
                            <Label className="text-muted-foreground text-xs">Quantity Received</Label>
                            <p className="font-bold text-lg">{qtyReceived.toLocaleString()}</p>
                          </div>
                        )}
                        {unitPrice > 0 && (
                          <div className="bg-blue-50 p-3 rounded-md">
                            <Label className="text-muted-foreground text-xs">Unit Price</Label>
                            <p className="font-bold text-lg">${unitPrice.toFixed(2)}</p>
                          </div>
                        )}
                        {merchandiseAmt > 0 && (
                          <div className="bg-green-50 p-3 rounded-md md:col-span-2">
                            <Label className="text-muted-foreground text-xs">Total Amount</Label>
                            <p className="font-bold text-2xl text-green-700">
                              ${merchandiseAmt.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* User & Update Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-3 border-t">
                      {oprid && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Created By</Label>
                          <p className="font-medium">{oprid}</p>
                        </div>
                      )}
                      {modifiedBy && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Modified By</Label>
                          <p className="font-medium">{modifiedBy}</p>
                        </div>
                      )}
                      {lastUpdate && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Last Updated</Label>
                          <p className="font-medium">
                            {new Date(lastUpdate).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Debug: Show all fields */}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">View Raw Data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(receipt, null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })}

              {/* Summary if multiple receipts */}
              {receipts.length > 1 && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    Total of {receipts.length} receipt line(s) found
                  </p>
                  <p className="text-lg font-bold mt-2">
                    Total Amount: ${receipts.reduce((sum: number, r: any) => 
                      sum + (parseFloat(r["MERCHANDISE_AMT"] || r["A.MERCHANDISE_AMT"]) || 0), 0
                    ).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
