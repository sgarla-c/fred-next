import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { Decimal } from "@prisma/client/runtime/library";
import { DeleteRentalButton } from "@/components/delete-rental-button";

interface RentalDetailPageProps {
  params: Promise<{ id: string }>;
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

export default async function ESRentalDetailPage({ params }: RentalDetailPageProps) {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const rentalId = parseInt(id);

  const rentalData = await prisma.rental.findUnique({
    where: { rentalId },
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
  });

  if (!rentalData) {
    notFound();
  }

  // Serialize Decimal fields
  const rental = serializeDecimal(rentalData);

  // ES users can only view their own rentals
  const userId = session.user.name || session.user.id;
  if (rental.rqstBy !== userId && session.user.role !== "Manager" && session.user.role !== "ADMIN") {
    notFound();
  }

  // Serialize linked POs to avoid Decimal serialization errors
  const linkedPOs = rental.rentalPos.map((rp: any) => serializeDecimal(rp.purchaseOrder));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/es/rentals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Rentals
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Rental Request #{rental.rentalId}</h1>
            <p className="text-muted-foreground mt-2">View your rental request details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {rental.rentStatus === "Denied" && (
            <Link href={`/es/rentals/${rental.rentalId}/edit`}>
              <Button variant="default">
                <Edit className="h-4 w-4 mr-2" />
                Edit & Resubmit
              </Button>
            </Link>
          )}
          <DeleteRentalButton 
            rentalId={rental.rentalId}
            currentStatus={rental.rentStatus || "Submitted"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rental Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rental ID</p>
                  <p className="font-medium">{rental.rentalId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rental.rentStatus === "Active"
                          ? "bg-green-100 text-green-800"
                          : rental.rentStatus === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : rental.rentStatus === "Delivered"
                          ? "bg-blue-100 text-blue-800"
                          : rental.rentStatus === "Denied"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {rental.rentStatus || "Submitted"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">District</p>
                  <p className="font-medium">{rental.district.distNm}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Section</p>
                  <p className="font-medium">{rental.section.sectNm || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested By</p>
                  <p className="font-medium">{rental.rqstBy || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Received By</p>
                  <p className="font-medium">{rental.rcvdBy || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submit Date</p>
                  <p className="font-medium">
                    {rental.submitDt
                      ? new Date(rental.submitDt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested Delivery Date</p>
                  <p className="font-medium">
                    {rental.dlvryRqstDt
                      ? new Date(rental.dlvryRqstDt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {rental.rentalDueDt
                      ? new Date(rental.rentalDueDt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {rental.durLngth && rental.durUom
                      ? `${rental.durLngth} ${rental.durUom}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Equipment Type</p>
                  <p className="font-medium">{rental.nigp?.dscr || "Not specified"}</p>
                  {rental.nigpCd && (
                    <p className="text-sm text-muted-foreground">Code: {rental.nigpCd}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Make</p>
                  <p className="font-medium">{rental.eqpmtMake || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{rental.eqpmtModel || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{rental.eqpmtQty || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendor Unit #</p>
                  <p className="font-medium">{rental.vendrUnitNbr || "N/A"}</p>
                </div>
              </div>
              {rental.eqpmtCmnt && (
                <div>
                  <p className="text-sm text-muted-foreground">Equipment Comments</p>
                  <p className="text-sm mt-1 p-3 bg-muted rounded whitespace-pre-wrap">
                    {rental.eqpmtCmnt}
                  </p>
                </div>
              )}
              {rental.eqpmtAtchmt && (
                <div>
                  <p className="text-sm text-muted-foreground">Attachments</p>
                  <p className="font-medium">{rental.eqpmtAtchmt}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery & Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Location</p>
                <p className="text-sm mt-1 p-3 bg-muted rounded">
                  {rental.dlvryLocn || "Not specified"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                  <p className="font-medium">{rental.pocNm || "N/A"}</p>
                  {rental.pocPhnNbr && (
                    <p className="text-sm text-muted-foreground">{rental.pocPhnNbr}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Secondary Contact</p>
                  <p className="font-medium">{rental.pocScndryNm || "N/A"}</p>
                  {rental.pocScndryPhnNbr && (
                    <p className="text-sm text-muted-foreground">
                      {rental.pocScndryPhnNbr}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {rental.spclInst && (
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap p-3 bg-muted rounded">
                  {rental.spclInst}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {linkedPOs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {linkedPOs.map((po: any) => (
                    <div
                      key={po.poId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">PO #{po.poNbr || po.poId}</p>
                        <p className="text-sm text-muted-foreground">
                          {po.vendrNm || "N/A"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          po.poStatus === "Active"
                            ? "bg-green-100 text-green-800"
                            : po.poStatus === "Draft"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {po.poStatus || "Open"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Chartfield Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rental.cfDeptNbr && (
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{rental.cfDeptNbr}</p>
                </div>
              )}
              {rental.cfAcctNbr && (
                <div>
                  <p className="text-sm text-muted-foreground">Account</p>
                  <p className="font-medium">{rental.cfAcctNbr}</p>
                </div>
              )}
              {rental.cfFund && (
                <div>
                  <p className="text-sm text-muted-foreground">Fund</p>
                  <p className="font-medium">{rental.cfFund}</p>
                </div>
              )}
              {rental.cfProj && (
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{rental.cfProj}</p>
                </div>
              )}
              {rental.cfActv && (
                <div>
                  <p className="text-sm text-muted-foreground">Activity</p>
                  <p className="font-medium">{rental.cfActv}</p>
                </div>
              )}
              {!rental.cfDeptNbr && !rental.cfAcctNbr && !rental.cfFund && !rental.cfProj && (
                <p className="text-sm text-muted-foreground">No chartfield data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {rental.lastUpdtDt
                    ? new Date(rental.lastUpdtDt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              {rental.rentCmnt && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <p className="text-sm mt-1 p-2 bg-muted rounded whitespace-pre-wrap">
                    {rental.rentCmnt}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
