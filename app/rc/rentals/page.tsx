import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FileText, ShoppingCart } from "lucide-react";
import { ProcessRentalButton } from "@/components/process-rental-button";
import { Decimal } from "@prisma/client/runtime/library";

// Helper to serialize Decimal and Date fields for Client Components
function serializeDecimal<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Convert to JSON and back to strip all prototypes, constructors, and functions
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    // Custom replacer to handle Decimal and Date
    if (value && typeof value === 'object') {
      // Check for Decimal
      if (value.constructor && value.constructor.name === 'Decimal') {
        return Number(value.toString());
      }
      // Check for Date
      if (value instanceof Date) {
        return value.toISOString();
      }
    }
    return value;
  }));
}

interface RCRentalsPageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

export default async function RCRentalsPage({ searchParams }: RCRentalsPageProps) {
  const params = await searchParams;
  const searchQuery = params.search?.toLowerCase() || "";
  const statusFilter = params.status || "";

  // Build the where clause for filtering
  const whereClause: any = {};
  
  if (statusFilter) {
    whereClause.rentStatus = statusFilter;
  }

  if (searchQuery) {
    whereClause.OR = [
      { rentalId: { equals: isNaN(parseInt(searchQuery)) ? undefined : parseInt(searchQuery) } },
      { rqstBy: { contains: searchQuery, mode: 'insensitive' } },
      { eqpmtMake: { contains: searchQuery, mode: 'insensitive' } },
      { eqpmtModel: { contains: searchQuery, mode: 'insensitive' } },
      { vendrUnitNbr: { contains: searchQuery, mode: 'insensitive' } },
    ].filter(condition => {
      // Remove undefined conditions
      const values = Object.values(condition);
      return !values.some(v => typeof v === 'object' && 'equals' in v && v.equals === undefined);
    });
  }

  const rentalsData = await prisma.rental.findMany({
    where: whereClause,
    include: {
      district: true,
      section: true,
      nigp: true,
      rentalPos: {
        include: {
          purchaseOrder: true,
        },
      },
    },
    orderBy: { submitDt: "desc" },
    take: 100,
  });

  // Serialize Decimal fields
  const rentals = rentalsData.map(serializeDecimal);

  // Get unique statuses for filter buttons (matching actual statuses in the database)
  const allStatuses = ["Submitted", "Pending", "Active", "Delivered", "Denied"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Rental Requests</h1>
        <p className="text-gray-600 mt-2">Manage and process equipment rental requests</p>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <form method="get" className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  name="search"
                  placeholder="Search by ID, requester, equipment make/model, or unit number..."
                  defaultValue={searchQuery}
                  className="w-full"
                />
              </div>
              <input type="hidden" name="status" value={statusFilter} />
              <Button type="submit">Search</Button>
              {(searchQuery || statusFilter) && (
                <Link href="/rc/rentals">
                  <Button type="button" variant="outline">Clear</Button>
                </Link>
              )}
            </div>
            
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center">Filter by status:</span>
              {allStatuses.map((status) => (
                <Link key={status} href={`/rc/rentals?status=${status}${searchQuery ? `&search=${searchQuery}` : ''}`}>
                  <Button
                    type="button"
                    size="sm"
                    variant={statusFilter === status ? "default" : "outline"}
                    className={statusFilter === status ? "" : ""}
                  >
                    {status}
                  </Button>
                </Link>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {rentals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || statusFilter ? "No matching rental requests found" : "No rental requests found"}
            </h3>
            {(searchQuery || statusFilter) && (
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Showing {rentals.length} rental request{rentals.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4">
            {rentals.map((rental) => (
              <Card key={rental.rentalId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {rental.nigp?.dscr || "Equipment Rental"}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        ID: {rental.rentalId} | By: {rental.rqstBy} | {rental.district.distNm} - {rental.section.sectNm}
                      </CardDescription>
                      
                      {/* Linked POs */}
                      {rental.rentalPos && rental.rentalPos.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <ShoppingCart className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-600">Linked POs:</span>
                          {rental.rentalPos.map((rp: any, idx: number) => (
                            <span key={rp.purchaseOrder.poId}>
                              <Link 
                                href={`/rc/purchase-orders/${rp.purchaseOrder.poId}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                {rp.purchaseOrder.poRlseNbr || `PO #${rp.purchaseOrder.poId}`}
                              </Link>
                              {idx < rental.rentalPos.length - 1 && <span className="text-gray-400">, </span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        rental.rentStatus === "Active"
                          ? "bg-green-100 text-green-700"
                          : rental.rentStatus === "Submitted"
                          ? "bg-yellow-100 text-yellow-700"
                          : rental.rentStatus === "Pending"
                          ? "bg-orange-100 text-orange-700"
                          : rental.rentStatus === "Delivered"
                          ? "bg-blue-100 text-blue-700"
                          : rental.rentStatus === "Denied"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {rental.rentStatus}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Submitted</p>
                      <p className="font-medium">
                        {rental.submitDt ? new Date(rental.submitDt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Equipment</p>
                      <p className="font-medium">{rental.eqpmtMake || "N/A"} {rental.eqpmtModel || ""}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{rental.durLngth || "N/A"} {rental.durUom || ""}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Due Date</p>
                      <p className="font-medium">
                        {rental.rentalDueDt ? new Date(rental.rentalDueDt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {rental.vendrUnitNbr && (
                        <span>Unit: <span className="font-medium text-gray-700">{rental.vendrUnitNbr}</span></span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/rc/rentals/${rental.rentalId}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                      <ProcessRentalButton 
                        rentalId={rental.rentalId} 
                        currentStatus={rental.rentStatus || "Submitted"}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
