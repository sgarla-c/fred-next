import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, DollarSign, FileText, Calendar } from "lucide-react";
import { getInvoiceById } from "@/app/actions/invoices";

interface InvoiceDetailPageProps {
  params: Promise<{ invcId: string }>;
}

export default async function FINInvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { invcId } = await params;
  const invoiceId = parseInt(invcId);

  const result = await getInvoiceById(invoiceId);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const invoice = result.data;
  
  // Calculate total amount from invoice lines
  const totalAmount = invoice.invoiceLines?.reduce((sum: number, line: any) => 
    sum + (line.itemAmt ? Number(line.itemAmt) : 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/fin/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Invoice #{invoice.invcNbr || invoice.invcId}</h1>
            <p className="text-muted-foreground mt-2">Invoice details and line items</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              invoice.invcStat === "COMPLETE"
                ? "bg-green-100 text-green-700"
                : invoice.invcStat === "PROCESSED"
                ? "bg-blue-100 text-blue-700"
                : invoice.invcStat === "PENDING"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {invoice.invcStat || "UNKNOWN"}
          </span>
          <div className="flex items-center gap-1 text-lg font-bold text-green-600">
            <DollarSign className="h-5 w-5" />
            {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice ID</p>
                  <p className="font-medium">{invoice.invcId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{invoice.invcNbr || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Claim Number</p>
                  <p className="font-medium">{invoice.claimNbr || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Date</p>
                  <p className="font-medium">
                    {invoice.invcDt ? new Date(invoice.invcDt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entry Date</p>
                  <p className="font-medium">
                    {invoice.entryDt ? new Date(invoice.entryDt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Financial Stamp Date</p>
                  <p className="font-medium">
                    {invoice.finStampDt ? new Date(invoice.finStampDt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Start</p>
                  <p className="font-medium">
                    {invoice.srvcStartDt ? new Date(invoice.srvcStartDt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Stop</p>
                  <p className="font-medium">
                    {invoice.srvcStopDt ? new Date(invoice.srvcStopDt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receipt Date</p>
                  <p className="font-medium">
                    {invoice.rcptDt ? new Date(invoice.rcptDt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receipt Number</p>
                  <p className="font-medium">{invoice.rcptNbr || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rental Coordinator</p>
                  <p className="font-medium">{invoice.rentCoordRspnbl || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{invoice.invcStat || "N/A"}</p>
                </div>
              </div>

              {invoice.fodNotes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">FOD Notes</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{invoice.fodNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Line Items ({invoice.invoiceLines?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!invoice.invoiceLines || invoice.invoiceLines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No line items found for this invoice
                </div>
              ) : (
                <div className="space-y-3">
                  {invoice.invoiceLines.map((line: any, index: number) => (
                    <div key={line.invcLnId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                              Line Item #{index + 1}
                            </span>
                            {line.purchaseOrder && (
                              <span className="text-xs text-muted-foreground">
                                PO: {line.purchaseOrder.poRlseNbr}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Amount</p>
                              <p className="font-semibold text-green-600">
                                ${line.itemAmt ? Number(line.itemAmt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Fiscal Year</p>
                              <p className="font-medium">{line.invcFiscalYr || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Vendor</p>
                              <p className="font-medium">{line.purchaseOrder?.vendrNm || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Rental ID</p>
                              <p className="font-medium">
                                {line.rentalId ? (
                                  <Link href={`/rc/rentals/${line.rentalId}`} className="text-blue-600 hover:underline">
                                    #{line.rentalId}
                                  </Link>
                                ) : "N/A"}
                              </p>
                            </div>
                          </div>

                          {line.rental && (
                            <div className="text-xs text-muted-foreground pt-2 border-t">
                              Equipment: {line.rental.nigp?.dscr || "N/A"} | 
                              District: {line.rental.district?.distNm || "N/A"} - {line.rental.section?.sectNm || "N/A"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Financial Status</p>
                <p className="font-medium">{invoice.finStat || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Financial ID</p>
                <p className="font-medium">{invoice.finId || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Financial Responsible</p>
                <p className="font-medium">{invoice.finRspnbl || "N/A"}</p>
              </div>
              {invoice.finNotes && (
                <div>
                  <p className="text-muted-foreground mb-1">Financial Notes</p>
                  <p className="text-xs bg-gray-50 p-2 rounded">{invoice.finNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Line Items</span>
                <span className="font-semibold">{invoice.invoiceLines?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-base font-medium">Total Amount</span>
                <span className="text-lg font-bold text-green-600">
                  ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Last Updated By</p>
                <p className="font-medium">{invoice.lastUpdtBy || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated Date</p>
                <p className="font-medium">
                  {invoice.lastUpdtDt ? new Date(invoice.lastUpdtDt).toLocaleString() : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
