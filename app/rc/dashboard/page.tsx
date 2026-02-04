import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, AlertCircle, CheckCircle, Clock, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProcessRentalButton } from "@/components/process-rental-button";

export default async function RCDashboard() {
  const session = await auth();
  
  if (!session) {
    return null;
  }

  // Fetch rental statistics
  const [totalRentals, pendingRentals, activeRentals, overdueRentals] = await Promise.all([
    prisma.rental.count(),
    prisma.rental.count({
      where: { rentStatus: { in: ["Submitted", "Pending"] } },
    }),
    prisma.rental.count({
      where: { rentStatus: { in: ["Active", "Delivered"] } },
    }),
    prisma.rental.count({
      where: {
        rentStatus: { in: ["Active", "Delivered"] },
        rentalDueDt: { lt: new Date() },
      },
    }),
  ]);

  // Fetch PO statistics
  const [totalPOs, activePOs, expiringPOs] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.count({
      where: { poStatus: "Active" },
    }),
    prisma.purchaseOrder.count({
      where: {
        poStatus: { in: ["Active", "Open"] },
        poExpirDt: { 
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rental Coordinator Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage equipment rentals and purchase orders</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/rc/rentals">
          <Button size="lg" className="gap-2">
            <FileText className="h-5 w-5" />
            Manage Rentals
          </Button>
        </Link>
        <Link href="/rc/purchase-orders">
          <Button variant="outline" size="lg" className="gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Orders
          </Button>
        </Link>
      </div>

      {/* Rental Statistics Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Rental Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rentals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRentals}</div>
              <p className="text-xs text-muted-foreground">All rentals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRentals}</div>
              <p className="text-xs text-muted-foreground">Requires action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRentals}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueRentals}</div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Purchase Order Statistics Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Purchase Order Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPOs}</div>
              <p className="text-xs text-muted-foreground">All purchase orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active POs</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePOs}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiringPOs}</div>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending Rentals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Rental Requests</CardTitle>
          <CardDescription>Rentals awaiting processing</CardDescription>
        </CardHeader>
        <CardContent>
          <PendingRentalsList />
        </CardContent>
      </Card>
    </div>
  );
}

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

async function PendingRentalsList() {
  const pendingRentalsData = await prisma.rental.findMany({
    where: { rentStatus: { in: ["Submitted", "Pending"] } },
    include: {
      district: true,
      section: true,
      nigp: true,
    },
    orderBy: { submitDt: "desc" },
    take: 10,
  });

  // Serialize Decimal fields
  const pendingRentals = pendingRentalsData.map(serializeDecimal);

  if (pendingRentals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No pending rental requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingRentals.map((rental) => (
        <div
          key={rental.rentalId}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{rental.nigp?.dscr || "Equipment"}</h4>
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                {rental.rentStatus}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Requested by: {rental.rqstBy} | {rental.district.distNm} - {rental.section.sectNm}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Submitted: {rental.submitDt ? new Date(rental.submitDt).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/rc/rentals/${rental.rentalId}`}>
              <Button variant="outline" size="sm">View</Button>
            </Link>
            <ProcessRentalButton 
              rentalId={rental.rentalId}
              currentStatus={rental.rentStatus || "Submitted"}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
