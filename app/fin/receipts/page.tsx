'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Package, Calendar, DollarSign, Hash, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

interface ReceiptSummary {
  receiverId: string;
  poId: string;
  businessUnit: string;
  receiptDate: string;
  lineCount: number;
  totalAmount: number;
  totalQuantity: number;
  items: Array<{
    lineNumber?: number;
    itemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export default function FINReceiptsPage() {
  const [businessUnit, setBusinessUnit] = useState('60144');
  const [receiptId, setReceiptId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptSummary | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessUnit || !receiptId) {
      setError('Please enter both Business Unit and Receipt ID');
      return;
    }

    setLoading(true);
    setError(null);
    setReceiptData(null);

    try {
      console.log('🔍 Searching for receipt:', { businessUnit, receiptId });
      
      const response = await fetch('/api/peoplesoft/query-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessUnit, receiptId }),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        setError(errorData.error || 'Failed to lookup receipt');
        return;
      }

      const data = await response.json();
      console.log('✅ Receipt data received:', data);

      // Transform PeopleSoft data into our summary format
      const receipts = data.data?.query?.rows || [];
      if (receipts.length > 0) {
        const firstReceipt = receipts[0];
        const totalAmount = receipts.reduce((sum: number, r: any) => sum + (r['A.MERCHANDISE_AMT'] || 0), 0);
        const totalQty = receipts.reduce((sum: number, r: any) => sum + (r['A.QTY_RCVD'] || 0), 0);

        const summary = {
          receiverId: firstReceipt['A.RECEIVER_ID'] || '',
          poId: firstReceipt['A.PO_ID'] || '',
          businessUnit: firstReceipt['A.BUSINESS_UNIT'] || businessUnit,
          receiptDate: firstReceipt['A.RECV_DT'] || '',
          lineCount: receipts.length,
          totalAmount,
          totalQuantity: totalQty,
          items: receipts.map((r: any, index: number) => ({
            lineNumber: r['A.LINE_NBR'] || r['A.RECV_LN_NBR'] || index + 1,
            itemId: r['A.INV_ITEM_ID'] || '',
            description: r['A.DESCR254_MIXED'] || '',
            quantity: r['A.QTY_RCVD'] || 0,
            unitPrice: r['A.UNIT_PRICE'] || 0,
            amount: r['A.MERCHANDISE_AMT'] || 0,
          }))
        };

        console.log('📊 Summary created:', summary);
        setReceiptData(summary);
      } else {
        setError('No receipt data found');
      }
    } catch (err) {
      console.error('💥 Exception:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Receipt Lookup</h1>
        <p className="text-gray-600 mt-2">Search and view receipt information from PeopleSoft API</p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search PeopleSoft Receipt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessUnit">Business Unit</Label>
                <Input
                  id="businessUnit"
                  placeholder="e.g., 60144"
                  value={businessUnit}
                  onChange={(e) => setBusinessUnit(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiptId">Receipt ID</Label>
                <Input
                  id="receiptId"
                  placeholder="e.g., 24584"
                  value={receiptId}
                  onChange={(e) => setReceiptId(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Receipt
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Receipt Results */}
      {receiptData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receipt ID</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{receiptData.receiverId}</div>
                <p className="text-xs text-muted-foreground">PO: {receiptData.poId}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receipt Date</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(receiptData.receiptDate).toLocaleDateString()}
                </div>
                <p className="text-xs text-muted-foreground">BU: {receiptData.businessUnit}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(receiptData.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Qty: {(receiptData.totalQuantity || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Line Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{receiptData.lineCount}</div>
                <p className="text-xs text-muted-foreground">Items received</p>
              </CardContent>
            </Card>
          </div>

          {/* Line Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>PeopleSoft Receipt Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm">Line</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Item ID</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Description</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Quantity</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Unit Price</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(receiptData.items || []).map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{item?.lineNumber || index + 1}</td>
                        <td className="py-3 px-4 text-sm font-mono">{item?.itemId || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{item?.description || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-right">
                          {(item?.quantity ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          ${(item?.unitPrice ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium">
                          ${(item?.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold">
                      <td colSpan={3} className="py-3 px-4 text-sm text-right">Total:</td>
                      <td className="py-3 px-4 text-sm text-right">
                        {(receiptData.totalQuantity || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm"></td>
                      <td className="py-3 px-4 text-sm text-right">
                        ${(receiptData.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

