import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FileText } from "lucide-react";
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

interface FINInvoicesPageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function FINInvoicesPage({ searchParams }: FINInvoicesPageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "";
  const searchQuery = params.search?.toLowerCase() || "";

  const whereClause: any = {};
  
  if (statusFilter) {
    whereClause.INVC_STAT = statusFilter;
  }

  if (searchQuery) {
    whereClause.OR = [
      { INVC_NBR: { contains: searchQuery, mode: 'insensitive' } },
      { RCPT_NBR: { contains: searchQuery, mode: 'insensitive' } },
      { FIN_ID: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  const invoicesData = await prisma.INVC.findMany({
    where: whereClause,
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
  const allStatuses = ["Submitted", "Pending", "Approved", "Processed", "Rejected"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
        <p className="text-gray-600 mt-2">Process and track equipment rental invoices</p>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <form method="get" className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  name="search"
                  placeholder="Search by invoice #, receipt #, or FIN ID..."
                  defaultValue={searchQuery}
                  className="w-full"
                />
              </div>
              <input type="hidden" name="status" value={statusFilter} />
              <Button type="submit">Search</Button>
              {(searchQuery || statusFilter) && (
                <Link href="/fin/invoices">
                  <Button type="button" variant="outline">Clear</Button>
                </Link>
              )}
            </div>
            
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center">Filter by status:</span>
              {allStatuses.map((status) => (
                <Link key={status} href={`/fin/invoices?status=${status}${searchQuery ? `&search=${searchQuery}` : ''}`}>
                  <Button
                    type="button"
                    size="sm"
                    variant={statusFilter === status ? "default" : "outline"}
                  >
                    {status}
                  </Button>
                </Link>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || statusFilter ? "No matching invoices found" : "No invoices found"}
            </h3>
            {(searchQuery || statusFilter) && (
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Showing {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4">
            {invoices.map((invoice: any) => {
              const totalAmount = invoice.INVC_LN?.reduce((sum: number, line: any) => 
                sum + (Number(line.ITEM_AMT) || 0), 0) || 0;

              return (
                <Card key={invoice.INVC_ID} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          Invoice #{invoice.INVC_NBR || invoice.INVC_ID}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {invoice.INVC_LN?.length || 0} line item(s) | 
                          Total: ${totalAmount.toFixed(2)}
                          {invoice.FIN_ID && ` | FIN ID: ${invoice.FIN_ID}`}
                        </CardDescription>
                        {invoice.FIN_RSPNBL && (
                          <p className="text-sm text-gray-600 mt-1">
                            Responsible: {invoice.FIN_RSPNBL}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          invoice.FIN_STAT === "Processed" || invoice.INVC_STAT === "Processed"
                            ? "bg-green-100 text-green-700"
                            : invoice.FIN_STAT === "Pending" || invoice.INVC_STAT === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : invoice.FIN_STAT === "Approved" || invoice.INVC_STAT === "Approved"
                            ? "bg-blue-100 text-blue-700"
                            : invoice.FIN_STAT === "Rejected" || invoice.INVC_STAT === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {invoice.FIN_STAT || invoice.INVC_STAT || "Submitted"}
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
                        <p className="text-gray-600">Receipt Date</p>
                        <p className="font-medium">
                          {invoice.RCPT_DT ? new Date(invoice.RCPT_DT).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Receipt #</p>
                        <p className="font-medium">{invoice.RCPT_NBR || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">FIN Stamp</p>
                        <p className="font-medium">
                          {invoice.FIN_STAMP_DT ? new Date(invoice.FIN_STAMP_DT).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    {(invoice.FIN_NOTES || invoice.FOD_NOTES) && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        {invoice.FIN_NOTES && <p><span className="font-medium">FIN Notes:</span> {invoice.FIN_NOTES}</p>}
                        {invoice.FOD_NOTES && <p><span className="font-medium">FOD Notes:</span> {invoice.FOD_NOTES}</p>}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {invoice.CLAIM_NBR && (
                          <span>Claim: <span className="font-medium text-gray-700">{invoice.CLAIM_NBR}</span></span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/fin/invoices/${invoice.INVC_ID}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                        <Link href={`/fin/invoices/${invoice.INVC_ID}`}>
                          <Button size="sm">Process</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
