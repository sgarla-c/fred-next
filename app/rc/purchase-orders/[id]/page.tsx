import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { POForm } from "@/components/po-form";
import { RentalLinkManager } from "@/components/rental-link-manager";
import { Decimal } from "@prisma/client/runtime/library";

interface POPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
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

export default async function PurchaseOrderPage({
  params,
  searchParams,
}: POPageProps) {
  const { id } = await params;
  const { edit } = await searchParams;
  const isEditing = edit === "true";
  const poId = parseInt(id);

  const purchaseOrderData = await prisma.purchaseOrder.findUnique({
    where: { poId },
    include: {
      rentalPos: {
        include: {
          rental: {
            include: {
              district: true,
              section: true,
              nigp: true,
            },
          },
        },
      },
    },
  });

  if (!purchaseOrderData) {
    notFound();
  }

  // Serialize Decimal fields
  const purchaseOrder = serializeDecimal(purchaseOrderData);

  // Get available rentals (not linked to this PO)
  const availableRentalsData = await prisma.rental.findMany({
    where: {
      NOT: {
        rentalPos: {
          some: {
            poId,
          },
        },
      },
    },
    include: {
      district: true,
      section: true,
      nigp: true,
    },
    orderBy: { submitDt: "desc" },
    take: 50,
  });

  // Serialize Decimal fields
  const availableRentals = availableRentalsData.map(serializeDecimal);

  const linkedRentals = purchaseOrder.rentalPos.map((rp) => ({
    rentalId: rp.rental.rentalId,
    rqstBy: rp.rental.rqstBy,
    rentStatus: rp.rental.rentStatus,
    district: rp.rental.district,
    nigp: rp.rental.nigp,
  }));

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/rc/purchase-orders/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to View
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Purchase Order #{purchaseOrder.poId}</h1>
            <p className="text-muted-foreground mt-2">
              Update purchase order details
            </p>
          </div>
        </div>

        <POForm
          purchaseOrder={{
            poId: purchaseOrder.poId,
            poRlseNbr: purchaseOrder.poRlseNbr || undefined,
            poRcvdBy: purchaseOrder.poRcvdBy || undefined,
            vendrNm: purchaseOrder.vendrNm || undefined,
            userRqstViaPurchFlg: purchaseOrder.userRqstViaPurchFlg,
            poBuNbr: purchaseOrder.poBuNbr || undefined,
            eRqstnNbr: purchaseOrder.eRqstnNbr || undefined,
            poStatus: purchaseOrder.poStatus || undefined,
            poStartDt: purchaseOrder.poStartDt || undefined,
            poExpirDt: purchaseOrder.poExpirDt || undefined,
            txdotGps: purchaseOrder.txdotGps,
            mnthEqRate: purchaseOrder.mnthEqRate
              ? parseFloat(purchaseOrder.mnthEqRate.toString())
              : undefined,
            poType: purchaseOrder.poType || undefined,
            spclEvnt: purchaseOrder.spclEvnt || undefined,
            chartFieldsFlg: purchaseOrder.chartFieldsFlg,
            vendorMail: purchaseOrder.vendorMail || undefined,
            vendorPhnNbr: purchaseOrder.vendorPhnNbr || undefined,
          }}
          isEditing={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/rc/purchase-orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Purchase Order #{purchaseOrder.poId}</h1>
            <p className="text-muted-foreground mt-2">
              View purchase order details and linked rentals
            </p>
          </div>
        </div>
        <Link href={`/rc/purchase-orders/${id}?edit=true`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit PO
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">PO ID</p>
                  <p className="font-medium">{purchaseOrder.poId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Release Number</p>
                  <p className="font-medium">{purchaseOrder.poRlseNbr || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        purchaseOrder.poStatus === "Active"
                          ? "bg-green-100 text-green-800"
                          : purchaseOrder.poStatus === "Open"
                          ? "bg-blue-100 text-blue-800"
                          : purchaseOrder.poStatus === "Closed"
                          ? "bg-gray-100 text-gray-800"
                          : purchaseOrder.poStatus === "Cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {purchaseOrder.poStatus || "Draft"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{purchaseOrder.poType || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {purchaseOrder.poStartDt
                      ? new Date(purchaseOrder.poStartDt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">
                    {purchaseOrder.poExpirDt
                      ? new Date(purchaseOrder.poExpirDt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rate</p>
                  <p className="font-medium">
                    {purchaseOrder.mnthEqRate
                      ? `$${parseFloat(purchaseOrder.mnthEqRate.toString()).toFixed(2)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Received By</p>
                  <p className="font-medium">{purchaseOrder.poRcvdBy || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Business Unit</p>
                  <p className="font-medium">{purchaseOrder.poBuNbr || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-Requisition</p>
                  <p className="font-medium">{purchaseOrder.eRqstnNbr || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Special Event</p>
                  <p className="font-medium">{purchaseOrder.spclEvnt || "—"}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={purchaseOrder.txdotGps}
                    disabled
                    className="rounded"
                  />
                  <span className="text-sm">TxDOT GPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={purchaseOrder.chartFieldsFlg}
                    disabled
                    className="rounded"
                  />
                  <span className="text-sm">Chart Fields Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={purchaseOrder.userRqstViaPurchFlg}
                    disabled
                    className="rounded"
                  />
                  <span className="text-sm">User Request via Purchase</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Vendor Name</p>
                  <p className="font-medium">{purchaseOrder.vendrNm || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{purchaseOrder.vendorMail || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{purchaseOrder.vendorPhnNbr || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Linked Rentals ({purchaseOrder.rentalPos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <RentalLinkManager
                poId={purchaseOrder.poId}
                linkedRentals={linkedRentals}
                availableRentals={availableRentals}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Last Updated By</p>
                <p className="font-medium">{purchaseOrder.lastUpdtBy || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {purchaseOrder.lastUpdtDt
                    ? new Date(purchaseOrder.lastUpdtDt).toLocaleString()
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
