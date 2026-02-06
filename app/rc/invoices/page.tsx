import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReceiptLink } from "@/components/receipt-link";
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

interface RCInvoicesPageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function RCInvoicesPage({ searchParams }: RCInvoicesPageProps) {
  const params = await searchParams;
  const statusFilterParam = params.status || "";
  const searchQuery = params.search?.toLowerCase() || "";

  // Parse multiple statuses separated by comma
  const selectedStatuses = statusFilterParam ? statusFilterParam.split(',').filter(Boolean) : [];

  const whereClause: any = {};
  
  if (selectedStatuses.length > 0) {
    // Filter by multiple statuses
    whereClause.INVC_STAT = { in: selectedStatuses };
  }

  if (searchQuery) {
    const searchConditions = [
      { INVC_NBR: { contains: searchQuery, mode: 'insensitive' } },
      { RCPT_NBR: { contains: searchQuery, mode: 'insensitive' } },
      { CLAIM_NBR: { contains: searchQuery, mode: 'insensitive' } },
    ];
    
    if (whereClause.INVC_STAT) {
      // Combine status filter with search using AND
      whereClause.AND = [
        { INVC_STAT: whereClause.INVC_STAT },
        { OR: searchConditions }
      ];
      delete whereClause.INVC_STAT;
    } else {
      whereClause.OR = searchConditions;
    }
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

  // Get unique status values from actual invoice data
  const uniqueStatuses = [...new Set(
    invoicesData
      .map(inv => inv.INVC_STAT)
      .filter(status => status !== null && status !== undefined)
  )].sort();

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

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <form method="get" className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  name="search"
                  placeholder="Search by invoice #, receipt #, or claim #..."
                  defaultValue={searchQuery}
                  className="w-full"
                />
              </div>
              <Button type="submit">Search</Button>
              {(searchQuery || selectedStatuses.length > 0) && (
                <Link href="/rc/invoices">
                  <Button type="button" variant="outline">Clear All</Button>
                </Link>
              )}
            </div>
            
            {/* Status Filters - Multi-select */}
            {uniqueStatuses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700 self-center">Filter by status:</span>
                {uniqueStatuses.map((status) => {
                  const isSelected = selectedStatuses.includes(status);
                  // Toggle status in the array
                  const newStatuses = isSelected
                    ? selectedStatuses.filter(s => s !== status)
                    : [...selectedStatuses, status];
                  const statusParam = newStatuses.length > 0 ? `status=${newStatuses.join(',')}` : '';
                  const searchParam = searchQuery ? `search=${searchQuery}` : '';
                  const params = [statusParam, searchParam].filter(Boolean).join('&');
                  const href = params ? `/rc/invoices?${params}` : '/rc/invoices';
                  
                  return (
                    <Link key={status} href={href}>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                      >
                        {status}
                        {isSelected && ' ✓'}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedStatuses.length > 0 ? "No matching invoices found" : "No invoices found"}
            </h3>
            {(searchQuery || selectedStatuses.length > 0) && (
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            )}
            {!searchQuery && selectedStatuses.length === 0 && (
              <p className="text-gray-600 text-center">Start by creating a new invoice</p>
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

            // Get business unit from first PO in invoice lines (first 5 chars)
            const firstPO = invoice.INVC_LN?.find((line: any) => line.PO?.poBuNbr)?.PO;
            const businessUnit = firstPO?.poBuNbr?.substring(0, 5);
            
            // Debug logging
            if (invoice.RCPT_NBR) {
              console.log('📋 Invoice receipt info:', {
                invoiceId: invoice.INVC_ID,
                receiptNbr: invoice.RCPT_NBR,
                businessUnit,
                poBuNbr: firstPO?.poBuNbr,
                hasInvoiceLines: !!invoice.INVC_LN?.length
              });
            }

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
                      {invoice.RCPT_NBR ? (
                        <ReceiptLink
                          receiptNumber={invoice.RCPT_NBR}
                          businessUnit={businessUnit}
                        />
                      ) : (
                        <p className="font-medium">N/A</p>
                      )}
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
        </div>
      )}
    </div>
  );
}
