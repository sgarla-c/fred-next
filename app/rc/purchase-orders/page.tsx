import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { POSearchFilter } from "@/components/po-search-filter";
import { ImportPOButton } from "@/components/import-po-button";
import { Prisma } from "@prisma/client";

interface SearchParams {
  search?: string;
  status?: string;
  vendor?: string;
  poType?: string;
  startDate?: string;
  endDate?: string;
}

export default async function RCPurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Build where clause based on search parameters
  const where: Prisma.PurchaseOrderWhereInput = {};

  if (params.search) {
    where.OR = [
      { poId: { equals: parseInt(params.search) || undefined } },
      { poRlseNbr: { contains: params.search, mode: "insensitive" } },
      { vendrNm: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.status) {
    where.poStatus = params.status;
  }

  if (params.vendor) {
    where.vendrNm = { contains: params.vendor, mode: "insensitive" };
  }

  if (params.poType) {
    where.poType = params.poType;
  }

  if (params.startDate || params.endDate) {
    where.poStartDt = {};
    if (params.startDate) {
      where.poStartDt.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      where.poStartDt.lte = new Date(params.endDate);
    }
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      rentalPos: {
        include: {
          rental: {
            include: {
              district: true,
              section: true,
            },
          },
        },
      },
    },
    orderBy: { poId: "desc" },
    take: 100,
  });

  const hasFilters = Object.keys(params).length > 0;
  const totalCount = await prisma.purchaseOrder.count({ where });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-2">Manage equipment purchase orders</p>
        </div>
        <div className="flex gap-2">
          <ImportPOButton />
          <Link href="/rc/purchase-orders/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter Section */}
      <POSearchFilter />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {hasFilters ? "Filtered Results" : "All Purchase Orders"}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {purchaseOrders.length === totalCount
                ? `${totalCount} total`
                : `Showing ${purchaseOrders.length} of ${totalCount}`}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">
                {hasFilters
                  ? "No purchase orders match your filters"
                  : "No purchase orders found"}
              </p>
              <p className="text-sm">
                {hasFilters
                  ? "Try adjusting your search criteria"
                  : "Create your first purchase order to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">PO ID</th>
                    <th className="text-left p-3 font-medium">Release #</th>
                    <th className="text-left p-3 font-medium">Vendor</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Start Date</th>
                    <th className="text-left p-3 font-medium">Expiry Date</th>
                    <th className="text-left p-3 font-medium">Monthly Rate</th>
                    <th className="text-left p-3 font-medium">Linked Rentals</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.poId} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{po.poId}</td>
                      <td className="p-3">{po.poRlseNbr || "—"}</td>
                      <td className="p-3">{po.vendrNm || "—"}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            po.poStatus === "Active"
                              ? "bg-green-100 text-green-800"
                              : po.poStatus === "Open"
                              ? "bg-blue-100 text-blue-800"
                              : po.poStatus === "Closed"
                              ? "bg-gray-100 text-gray-800"
                              : po.poStatus === "Cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {po.poStatus || "Draft"}
                        </span>
                      </td>
                      <td className="p-3">{po.poType || "—"}</td>
                      <td className="p-3">
                        {po.poStartDt
                          ? new Date(po.poStartDt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-3">
                        {po.poExpirDt
                          ? new Date(po.poExpirDt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-3">
                        {po.mnthEqRate
                          ? `$${parseFloat(po.mnthEqRate.toString()).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="p-3 text-center">
                        {po.rentalPos.length}
                      </td>
                      <td className="p-3">
                        <Link href={`/rc/purchase-orders/${po.poId}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
