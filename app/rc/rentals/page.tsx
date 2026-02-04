import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
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

export default async function RCRentalsPage() {
  const rentalsData = await prisma.rental.findMany({
    include: {
      district: true,
      section: true,
      nigp: true,
    },
    orderBy: { submitDt: "desc" },
    take: 50,
  });

  // Serialize Decimal fields
  const rentals = rentalsData.map(serializeDecimal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Rental Requests</h1>
          <p className="text-gray-600 mt-2">Manage and process equipment rental requests</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>

      {rentals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rental requests found</h3>
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
                      ID: {rental.rentalId} | By: {rental.rqstBy} | {rental.district.distNm} - {rental.section.sectNm}
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
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-medium">
                      {rental.rentalDueDt ? new Date(rental.rentalDueDt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                  <Link href={`/rc/rentals/${rental.rentalId}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                  <ProcessRentalButton 
                    rentalId={rental.rentalId} 
                    currentStatus={rental.rentStatus || "Submitted"}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
