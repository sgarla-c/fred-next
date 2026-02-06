import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, DollarSign, CheckCircle, Clock, Database } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getInvoiceStats } from "@/app/actions/invoices";

export default async function FINDashboard() {
  // Fetch real invoice statistics
  const statsResult = await getInvoiceStats();
  const stats = statsResult.success ? statsResult.data : { total: 0, pending: 0, processed: 0, complete: 0 };
  
  const totalInvoices = stats.total;
  const pendingInvoices = stats.pending;
  const processedInvoices = stats.processed + stats.complete;
  
  // Calculate total amount from invoice lines
  const invoiceLinesTotal = await prisma.invoiceLine.aggregate({
    _sum: {
      itemAmt: true,
    },
  });
  const totalAmount = invoiceLinesTotal._sum.itemAmt ? Number(invoiceLinesTotal._sum.itemAmt) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage invoices and financial processing</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/fin/invoices">
          <Button size="lg" className="gap-2">
            <FileText className="h-5 w-5" />
            Manage Invoices
          </Button>
        </Link>
        <Link href="/fin/receipts">
          <Button variant="outline" size="lg" className="gap-2">
            <FileText className="h-5 w-5" />
            Receipt Lookup
          </Button>
        </Link>
        <Link href="/fin/peoplesoft-query">
          <Button variant="outline" size="lg" className="gap-2">
            <Database className="h-5 w-5" />
            PeopleSoft Query
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedInvoices}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No invoices to display</p>
            <p className="text-sm mt-2">Invoice management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
