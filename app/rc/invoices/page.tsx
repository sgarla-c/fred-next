import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Decimal } from "@prisma/client/runtime/library";

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

export default async function RCInvoicesPage() {
  const invoicesData = await prisma.INVC.findMany({
    include: {
      INVC_LN: {
        include: {
          RENTAL: {
            include: {
              district: true,
              section: true,
            },
          },
          PO: true,
        },
      },
    },
    orderBy: { LAST_UPDT_DT: "desc" },
    take: 100,
  });

  const invoices = invoicesData.map(serializeDecimal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 mt-2">Track and manage rental invoices</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600 text-center">Start by creating a new invoice</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice: any) => {
            const totalAmount = invoice.INVC_LN?.reduce((sum: number, line: any) => 
              sum + (Number(line.ITEM_AMT) || 0), 0) || 0;

            return (
              <Card key={invoice.INVC_ID} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        Invoice #{invoice.INVC_NBR || invoice.INVC_ID}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {invoice.INVC_LN?.length || 0} line item(s) | 
                        Total: ${totalAmount.toFixed(2)}
                      </CardDescription>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        invoice.INVC_STAT === "Processed"
                          ? "bg-green-100 text-green-700"
                          : invoice.INVC_STAT === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : invoice.INVC_STAT === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {invoice.INVC_STAT || "Submitted"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Invoice Date</p>
                      <p className="font-medium">
                        {invoice.INVC_DT ? new Date(invoice.INVC_DT).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Entry Date</p>
                      <p className="font-medium">
                        {invoice.ENTRY_DT ? new Date(invoice.ENTRY_DT).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Receipt #</p>
                      <p className="font-medium">{invoice.RCPT_NBR || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Service Period</p>
                      <p className="font-medium">
                        {invoice.SRVC_START_DT && invoice.SRVC_STOP_DT
                          ? `${new Date(invoice.SRVC_START_DT).toLocaleDateString()} - ${new Date(invoice.SRVC_STOP_DT).toLocaleDateString()}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                    <Link href={`/rc/invoices/${invoice.INVC_ID}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                    <Link href={`/rc/invoices/${invoice.INVC_ID}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
