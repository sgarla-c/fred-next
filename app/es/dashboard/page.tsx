import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText, Clock, CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export default async function ESDashboard() {
  const session = await auth();
  
  if (!session) {
    return null;
  }

  // Fetch user's rental statistics
  const userId = session.user.id;
  
  const [totalRentals, activeRentals, pendingRentals] = await Promise.all([
    prisma.rental.count({
      where: { rqstBy: session.user.name || userId },
    }),
    prisma.rental.count({
      where: {
        rqstBy: session.user.name || userId,
        rentStatus: { in: ["Active", "Delivered"] },
      },
    }),
    prisma.rental.count({
      where: {
        rqstBy: session.user.name || userId,
        rentStatus: { in: ["Submitted", "Pending"] },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {session.user.name}</h1>
        <p className="text-gray-600 mt-2">Equipment Section Dashboard</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/es/rentals/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Submit New Rental Request
          </Button>
        </Link>
        <Link href="/es/rentals">
          <Button variant="outline" size="lg" className="gap-2">
            <FileText className="h-5 w-5" />
            View My Rentals
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rentals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRentals}</div>
            <p className="text-xs text-muted-foreground">All time</p>
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
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRentals}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rentals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rental Requests</CardTitle>
          <CardDescription>Your latest equipment rental submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentRentalsList userId={session.user.name || userId} />
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

async function RecentRentalsList({ userId }: { userId: string }) {
  const recentRentalsData = await prisma.rental.findMany({
    where: { rqstBy: userId },
    include: {
      district: true,
      section: true,
      nigp: true,
    },
    orderBy: { submitDt: "desc" },
    take: 5,
  });

  // Serialize Decimal fields
  const recentRentals = recentRentalsData.map(serializeDecimal);

  if (recentRentals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No rental requests yet</p>
        <Link href="/es/rentals/new">
          <Button className="mt-4" size="sm">Submit Your First Request</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentRentals.map((rental) => (
        <div
          key={rental.rentalId}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{rental.nigp?.dscr || "Equipment"}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                rental.rentStatus === "Active" ? "bg-green-100 text-green-700" :
                rental.rentStatus === "Submitted" ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {rental.rentStatus}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {rental.district.distNm} - {rental.section.sectNm}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Submitted: {rental.submitDt ? new Date(rental.submitDt).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <Link href={`/es/rentals/${rental.rentalId}`}>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
