import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
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

export default async function ESRentalsPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const userId = session.user.name || session.user.id;

  const rentalsData = await prisma.rental.findMany({
    where: { rqstBy: userId },
    include: {
      district: true,
      section: true,
      nigp: true,
    },
    orderBy: { submitDt: "desc" },
  });

  // Serialize Decimal fields
  const rentals = rentalsData.map(serializeDecimal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Rental Requests</h1>
          <p className="text-gray-600 mt-2">View and manage your equipment rental requests</p>
        </div>
        <Link href="/es/rentals/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {rentals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rental requests yet</h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Get started by submitting your first equipment rental request
            </p>
            <Link href="/es/rentals/new">
              <Button>Submit First Request</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rentals.map((rental) => (
            <Card key={rental.rentalId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {rental.nigp?.dscr || "Equipment Rental"}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Rental ID: {rental.rentalId} | District: {rental.district.distNm} - {rental.section.sectNm}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      rental.rentStatus === "Active"
                        ? "bg-green-100 text-green-700"
                        : rental.rentStatus === "Submitted"
                        ? "bg-yellow-100 text-yellow-700"
                        : rental.rentStatus === "Completed"
                        ? "bg-blue-100 text-blue-700"
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
                    <p className="text-gray-600">Quantity</p>
                    <p className="font-medium">{rental.eqpmtQty || 1}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Link href={`/es/rentals/${rental.rentalId}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
