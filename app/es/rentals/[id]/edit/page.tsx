import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RentalForm } from "@/components/rental-form";
import { getDistricts, getNigpCodes } from "@/app/actions/rental";

interface EditRentalPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRentalPage({ params }: EditRentalPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const rentalId = parseInt(id);

  // Fetch the rental
  const rental = await prisma.rental.findUnique({
    where: { rentalId },
    include: {
      district: true,
      section: true,
      nigp: true,
    },
  });

  if (!rental) {
    notFound();
  }

  // Check authorization - ES can only edit their own rentals
  const userId = session.user.name || session.user.id;
  const isOwner = rental.rqstBy === userId;
  const isAdmin = ["Manager", "ADMIN"].includes(session.user.role || "");

  if (!isOwner && !isAdmin) {
    redirect("/es/rentals");
  }

  // Check if rental is denied (only denied rentals can be edited)
  if (rental.rentStatus !== "Denied") {
    redirect(`/es/rentals/${rentalId}`);
  }

  // Fetch data for the form
  const [districtsResult, nigpResult] = await Promise.all([
    getDistricts(),
    getNigpCodes(),
  ]);

  if (!districtsResult.success || !nigpResult.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load form data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit & Resubmit Rental Request</h1>
        <p className="text-gray-600 mt-2">
          Modify your rental request and resubmit for approval.
        </p>
        {rental.spclInst?.includes("[DENIED]") && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800">Denial Reason:</p>
            <p className="text-sm text-red-700 mt-1">
              {rental.spclInst.replace("[DENIED]:", "").replace("[DENIED]", "").trim()}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <RentalForm 
          districts={districtsResult.data || []} 
          nigpCodes={nigpResult.data || []} 
          existingRental={{
            rentalId: rental.rentalId,
            sectId: rental.sectId,
            distNbr: rental.distNbr,
            nigpCd: rental.nigpCd || "",
            dlvryRqstDt: rental.dlvryRqstDt ? rental.dlvryRqstDt.toISOString().split('T')[0] : "",
            durLngth: rental.durLngth || 0,
            durUom: rental.durUom || "Month",
            eqpmtModel: rental.eqpmtModel || "",
            eqpmtMake: rental.eqpmtMake || "",
            eqpmtCmnt: rental.eqpmtCmnt || "",
            eqpmtQty: rental.eqpmtQty || 1,
            dlvryLocn: rental.dlvryLocn || "",
            pocNm: rental.pocNm || "",
            pocPhnNbr: rental.pocPhnNbr || "",
            cfDeptNbr: rental.cfDeptNbr || "",
            cfAcctNbr: rental.cfAcctNbr || "",
            cfAppropYr: rental.cfAppropYr || "",
            cfAppropClass: rental.cfAppropClass || "",
            cfFund: rental.cfFund || "",
            cfBusUnit: rental.cfBusUnit || "",
            cfProj: rental.cfProj || "",
            cfActv: rental.cfActv || "",
            cfSrcType: rental.cfSrcType || "",
            cfTask: rental.cfTask || "",
            spclInst: rental.spclInst?.includes("[DENIED]") ? "" : (rental.spclInst || ""),
          }}
          isEdit={true}
        />
      </div>
    </div>
  );
}
