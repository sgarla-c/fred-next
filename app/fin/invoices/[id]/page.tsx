import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Decimal } from "@prisma/client/runtime/library";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

// Helper to serialize Decimal and Date fields
function serializeDecimal<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object') {
      if (value.constructor && value.constructor.name === 'Decimal') {
        return Number(value.toString());
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
    }
    return value;
  }));
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  const invoiceId = parseInt(id);

  const invoiceData = await prisma.iNVC.findUnique({
    where: { INVC_ID: invoiceId },
    include: {
      INVC_LN: {
        include: {
          RENTAL: {
            include: {
              district: true,
              section: true,
              nigp: true,
            },
          },
          PO: true,
        },
      },
    },
  });

  if (!invoiceData) {
    notFound();
  }

  const invoice = serializeDecimal(invoiceData);
  const totalAmount = invoice.INVC_LN?.reduce((sum: number, line: any) => 
    sum + (Number(line.ITEM_AMT) || 0), 0) || 0;

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
            <h1 className="text-3xl font-bold">Invoice #{invoice.INVC_NBR || invoice.INVC_ID}</h1>
            <p className="text-muted-foreground mt-2">Review and process invoice</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Reject</Button>
          <Button variant="outline">Approve</Button>
          <Button>Process Payment</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{invoice.INVC_NBR || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Status</p>
                  <p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.INVC_STAT === "Processed"
                          ? "bg-green-100 text-green-800"
                          : invoice.INVC_STAT === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : invoice.INVC_STAT === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {invoice.INVC_STAT || "Submitted"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Date</p>
                  <p className="font-medium">
                    {invoice.INVC_DT
                      ? new Date(invoice.INVC_DT).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entry Date</p>
                  <p className="font-medium">
                    {invoice.ENTRY_DT
                      ? new Date(invoice.ENTRY_DT).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receipt Number</p>
                  <p className="font-medium">{invoice.RCPT_NBR || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receipt Date</p>
                  <p className="font-medium">
                    {invoice.RCPT_DT
                      ? new Date(invoice.RCPT_DT).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Claim Number</p>
                  <p className="font-medium">{invoice.CLAIM_NBR || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rent Coordinator</p>
                  <p className="font-medium">{invoice.RENT_COORD_RSPNBL || "N/A"}</p>
                </div>
              </div>

              {invoice.SRVC_START_DT && invoice.SRVC_STOP_DT && (
                <div>
                  <p className="text-sm text-muted-foreground">Service Period</p>
                  <p className="font-medium">
                    {new Date(invoice.SRVC_START_DT).toLocaleDateString()} - {new Date(invoice.SRVC_STOP_DT).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finance Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">FIN Status</p>
                  <p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.FIN_STAT === "Processed"
                          ? "bg-green-100 text-green-800"
                          : invoice.FIN_STAT === "Approved"
                          ? "bg-blue-100 text-blue-800"
                          : invoice.FIN_STAT === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {invoice.FIN_STAT || "Not Set"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">FIN ID</p>
                  <p className="font-medium">{invoice.FIN_ID || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">FIN Responsible</p>
                  <p className="font-medium">{invoice.FIN_RSPNBL || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">FIN Stamp Date</p>
                  <p className="font-medium">
                    {invoice.FIN_STAMP_DT
                      ? new Date(invoice.FIN_STAMP_DT).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(invoice.FIN_NOTES || invoice.FOD_NOTES) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes & Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.FIN_NOTES && (
                  <div>
                    <p className="text-sm text-muted-foreground">Finance Notes</p>
                    <p className="text-sm mt-1 p-3 bg-muted rounded">
                      {invoice.FIN_NOTES}
                    </p>
                  </div>
                )}
                {invoice.FOD_NOTES && (
                  <div>
                    <p className="text-sm text-muted-foreground">FOD Notes</p>
                    <p className="text-sm mt-1 p-3 bg-muted rounded">
                      {invoice.FOD_NOTES}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Invoice Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.INVC_LN && invoice.INVC_LN.length > 0 ? (
                <div className="space-y-4">
                  {invoice.INVC_LN.map((line: any, index: number) => (
                    <div key={line.INVC_LN_ID} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">Line Item {index + 1}</h4>
                        <p className="font-semibold text-lg">${Number(line.ITEM_AMT || 0).toFixed(2)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {line.RENTAL && (
                          <div>
                            <p className="text-muted-foreground">Rental Request</p>
                            <Link href={`/rc/rentals/${line.RENTAL.rentalId}`} className="text-blue-600 hover:underline font-medium">
                              Rental #{line.RENTAL.rentalId}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-1">
                              {line.RENTAL.district.distNm} - {line.RENTAL.section.sectNm}
                            </p>
                            {line.RENTAL.nigp && (
                              <p className="text-xs text-muted-foreground">
                                {line.RENTAL.nigp.dscr}
                              </p>
                            )}
                          </div>
                        )}
                        {line.PO && (
                          <div>
                            <p className="text-muted-foreground">Purchase Order</p>
                            <Link href={`/rc/purchase-orders/${line.PO.poId}`} className="text-blue-600 hover:underline font-medium">
                              PO #{line.PO.poRlseNbr || line.PO.poId}
                            </Link>
                            {line.PO.vendrNm && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Vendor: {line.PO.vendrNm}
                              </p>
                            )}
                          </div>
                        )}
                        {line.INVC_FISCAL_YR && (
                          <div>
                            <p className="text-muted-foreground">Fiscal Year</p>
                            <p className="font-medium">{line.INVC_FISCAL_YR}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No line items found</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Line Items</p>
                <p className="text-2xl font-bold">{invoice.INVC_LN?.length || 0}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold text-green-600">${totalAmount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {invoice.ENTRY_DT && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entered</span>
                  <span className="font-medium">{new Date(invoice.ENTRY_DT).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.RCPT_DT && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Received</span>
                  <span className="font-medium">{new Date(invoice.RCPT_DT).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.FIN_STAMP_DT && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FIN Stamped</span>
                  <span className="font-medium">{new Date(invoice.FIN_STAMP_DT).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.LAST_UPDT_DT && (
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">{new Date(invoice.LAST_UPDT_DT).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.LAST_UPDT_BY && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated By</span>
                  <span className="font-medium">{invoice.LAST_UPDT_BY}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
