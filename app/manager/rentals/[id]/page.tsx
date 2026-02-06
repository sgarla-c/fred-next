import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RentalAttachments } from "@/components/rental-attachments";

interface LifecyclePageProps {
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

export default async function ManagerRentalLifecyclePage({ params }: LifecyclePageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "Manager" && session.user.role !== "ADMIN") {
    notFound();
  }

  const { id } = await params;
  const rentalId = parseInt(id);

  const rentalData = await prisma.rental.findUnique({
    where: { rentalId },
    include: {
      district: true,
      section: true,
      nigp: true,
      attachments: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
    },
  });
  if (!rentalData) {
    notFound();
  }

  // Serialize Decimal fields
  const rental = serializeDecimal(rentalData);

  const history = await prisma.rentalStatusHistory.findMany({
    where: { rentalId },
    orderBy: { createdAt: "asc" },
  });

  const derivedInitial = rental.submitDt && rental.rqstBy
    ? [{
        status: "Submitted",
        actorName: rental.rqstBy ?? undefined,
        actorId: undefined,
        note: "Initial submission",
        createdAt: rental.submitDt,
      }]
    : [];

  const timeline = history.length > 0 ? history : (derivedInitial as any[]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/manager/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manager Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Rental Lifecycle #{rental.rentalId}</h1>
            <p className="text-muted-foreground mt-2">Who submitted/approved/denied/resubmitted and when</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lifecycle events recorded.</p>
              ) : (
                <ol className="relative border-l pl-6 space-y-6">
                  {timeline.map((evt: any, idx: number) => (
                    <li key={idx} className="">
                      <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary" />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {evt.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(evt.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">By:</span> {evt.actorName || evt.actorId || "Unknown"}
                        </div>
                        {evt.note && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Note:</span> {evt.note}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <p className="font-medium">{rental.rentStatus || "Submitted"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">District / Section</p>
                <p className="font-medium">{rental.district.distNm} / {rental.section.sectNm || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requested By</p>
                <p className="font-medium">{rental.rqstBy || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submit Date</p>
                <p className="font-medium">{rental.submitDt ? new Date(rental.submitDt).toLocaleDateString() : "N/A"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <RentalAttachments
                rentalId={rental.rentalId}
                attachments={rental.attachments as any}
                readOnly={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
