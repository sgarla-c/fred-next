import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Search, DollarSign } from "lucide-react";
import { getInvoices } from "@/app/actions/invoices";
import Link from "next/link";

export default async function FINInvoicesPage() {
  const result = await getInvoices({ limit: 100 });
  const invoices = result.success ? result.data : [];

  // Calculate total amount for each invoice from invoice lines
  const invoicesWithTotals = invoices.map((invoice: any) => ({
    ...invoice,
    totalAmount: invoice.invoiceLines?.reduce((sum: number, line: any) => 
      sum + (line.itemAmt ? Number(line.itemAmt) : 0), 0) || 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 text-sm">Process and manage equipment rental invoices</p>
        </div>
        <Button variant="outline" className="gap-2" size="sm">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {invoices.filter((inv: any) => inv.invcStat === "PENDING").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processed</p>
                <p className="text-2xl font-bold">
                  {invoices.filter((inv: any) => inv.invcStat === "PROCESSED").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Complete</p>
                <p className="text-2xl font-bold">
                  {invoices.filter((inv: any) => inv.invcStat === "COMPLETE").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600 text-center max-w-md">
              Invoice data has been migrated. Invoices will appear here as they are processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {invoicesWithTotals.map((invoice: any) => (
            <Card key={invoice.invcId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">
                      Invoice #{invoice.invcNbr || invoice.invcId}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      ID: {invoice.invcId} | Coord: {invoice.rentCoordRspnbl || "N/A"} | 
                      {invoice.invoiceLines?.length || 0} line items
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
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
                    <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                      <DollarSign className="h-3 w-3" />
                      {invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs flex-1">
                    <div>
                      <p className="text-gray-600">Invoice Date</p>
                      <p className="font-medium">
                        {invoice.invcDt ? new Date(invoice.invcDt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Entry Date</p>
                      <p className="font-medium">
                        {invoice.entryDt ? new Date(invoice.entryDt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Receipt #</p>
                      <p className="font-medium">{invoice.rcptNbr || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Receipt Date</p>
                      <p className="font-medium">
                        {invoice.rcptDt ? new Date(invoice.rcptDt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/fin/invoices/${invoice.invcId}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
