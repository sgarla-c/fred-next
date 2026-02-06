"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { sendRentalApprovalNotification } from "@/lib/email";
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

// Fetch all districts
export async function getDistricts() {
  try {
    const districts = await prisma.district.findMany({
      orderBy: { distNbr: 'asc' },
      select: {
        distNbr: true,
        distNm: true,
      },
    });
    return { success: true, data: districts };
  } catch (error) {
    console.error("Error fetching districts:", error);
    return { success: false, error: "Failed to fetch districts" };
  }
}

// Fetch sections for a specific district
export async function getSectionsByDistrict(distNbr: number) {
  try {
    const sections = await prisma.section.findMany({
      where: { distNbr },
      orderBy: { sectNbr: 'asc' },
      select: {
        sectId: true,
        sectNbr: true,
        sectNm: true,
      },
    });
    return { success: true, data: sections };
  } catch (error) {
    console.error("Error fetching sections:", error);
    return { success: false, error: "Failed to fetch sections" };
  }
}

// Fetch NIGP equipment codes
export async function getNigpCodes() {
  try {
    const nigpCodes = await prisma.nigp.findMany({
      orderBy: { dscr: 'asc' },
      select: {
        nigpCd: true,
        dscr: true,
        avgMonthlyRate: true,
      },
    });
    
    // Convert Decimal to number for serialization
    const serializedNigpCodes = nigpCodes.map(code => ({
      ...code,
      avgMonthlyRate: code.avgMonthlyRate ? Number(code.avgMonthlyRate) : null,
    }));
    
    return { success: true, data: serializedNigpCodes };
  } catch (error) {
    console.error("Error fetching NIGP codes:", error);
    return { success: false, error: "Failed to fetch NIGP codes" };
  }
}

// Submit rental request
export async function submitRental(data: any) {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const rental = await prisma.rental.create({
      data: {
        sectId: data.sectId,
        distNbr: data.distNbr,
        nigpCd: data.nigpCd,
        submitDt: new Date(),
        rentStatus: "Submitted",
        rqstBy: session.user.name || session.user.id,
        dlvryRqstDt: data.dlvryRqstDt ? new Date(data.dlvryRqstDt) : null,
        durLngth: data.durLngth,
        durUom: data.durUom,
        eqpmtModel: data.eqpmtModel,
        eqpmtMake: data.eqpmtMake,
        eqpmtCmnt: data.eqpmtCmnt,
        eqpmtAtchmt: data.eqpmtAtchmt,
        eqpmtQty: data.eqpmtQty,
        dlvryLocn: data.dlvryLocn,
        pocNm: data.pocNm,
        pocPhnNbr: data.pocPhnNbr,
        // Chartfields
        cfDeptNbr: data.cfDeptNbr,
        cfAcctNbr: data.cfAcctNbr,
        cfAppropYr: data.cfAppropYr,
        cfAppropClass: data.cfAppropClass,
        cfFund: data.cfFund,
        cfBusUnit: data.cfBusUnit,
        cfProj: data.cfProj,
        cfActv: data.cfActv,
        cfSrcType: data.cfSrcType,
        cfTask: data.cfTask,
        spclInst: data.spclInst,
        troubleRentFlg: false,
        lastUpdtBy: session.user.id,
        lastUpdtDt: new Date(),
      },
      include: {
        district: true,
        section: true,
        nigp: true,
      },
    });

    // Record status history: Submitted
    try {
      await prisma.rentalStatusHistory.create({
        data: {
          rentalId: rental.rentalId,
          status: "Submitted",
          actorId: session.user.id,
          actorName: (session.user.name as string) || null,
          note: "Initial submission",
        },
      });
    } catch (histError) {
      console.error("Error recording submission history:", histError);
    }

    // Send email notification to RC users
    try {
      // Get all RC users with email addresses
      const rcUsers = await prisma.user.findMany({
        where: {
          usrRole: "RC",
          usrEmail: { not: null },
        },
        select: {
          usrEmail: true,
        },
      });

      const rcEmails = rcUsers
        .map((user) => user.usrEmail)
        .filter((email): email is string => email !== null);

      if (rcEmails.length > 0) {
        const approvalLink = `${process.env.NEXTAUTH_URL || "http://localhost:3100"}/rc/rentals/${rental.rentalId}`;
        
        await sendRentalApprovalNotification(rcEmails, {
          rentalId: rental.rentalId,
          requestedBy: rental.rqstBy || "Unknown",
          district: rental.district.distNm,
          section: rental.section.sectNm || "N/A",
          equipmentType: rental.nigp?.dscr || "N/A",
          deliveryDate: rental.dlvryRqstDt
            ? new Date(rental.dlvryRqstDt).toLocaleDateString()
            : undefined,
          deliveryLocation: rental.dlvryLocn || undefined,
          approvalLink,
        });
        
        console.log(`Rental approval notification sent to ${rcEmails.length} RC users`);
      } else {
        console.warn("No RC users with email addresses found for notification");
      }
    } catch (emailError) {
      // Log email error but don't fail the rental submission
      console.error("Error sending rental notification email:", emailError);
    }

    revalidatePath("/rental/new");
    return { success: true, data: serializeDecimal(rental) };
  } catch (error) {
    console.error("Error creating rental:", error);
    return { success: false, error: "Failed to submit rental request" };
  }
}

// Update rental status (e.g., RC approving/processing a rental)
export async function updateRentalStatus(rentalId: number, status: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user has permission (RC role or higher)
  const allowedRoles = ["RC", "Manager", "ADMIN"];
  if (!session.user.role || !allowedRoles.includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    const rental = await prisma.rental.update({
      where: { rentalId },
      data: {
        rentStatus: status,
        lastUpdtBy: session.user.id,
        lastUpdtDt: new Date(),
        ...(status === "Active" && { rcvdBy: session.user.name || session.user.id }),
      },
    });

    // Record status history
    try {
      await prisma.rentalStatusHistory.create({
        data: {
          rentalId,
          status,
          actorId: session.user.id,
          actorName: (session.user.name as string) || null,
        },
      });
    } catch (histError) {
      console.error("Error recording status history:", histError);
    }

    revalidatePath("/rc/rentals");
    revalidatePath(`/rc/rentals/${rentalId}`);
    revalidatePath("/rc/dashboard");
    return { success: true, data: rental };
  } catch (error) {
    console.error("Error updating rental status:", error);
    return { success: false, error: "Failed to update rental status" };
  }
}

// Delete rental request (ES user can delete their own unprocessed rentals)
export async function deleteRental(rentalId: number) {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get the rental to check ownership and status
    const rental = await prisma.rental.findUnique({
      where: { rentalId },
      select: {
        rqstBy: true,
        rentStatus: true,
      },
    });

    if (!rental) {
      return { success: false, error: "Rental not found" };
    }

    // Check if user owns the rental or is Manager/ADMIN
    const userId = session.user.name || session.user.id;
    const isOwner = rental.rqstBy === userId;
    const isAdmin = ["Manager", "ADMIN"].includes(session.user.role || "");

    if (!isOwner && !isAdmin) {
      return { success: false, error: "You don't have permission to delete this rental" };
    }

    // Only allow deletion if status is Submitted or Pending
    const allowedStatuses = ["Submitted", "Pending"];
    if (!allowedStatuses.includes(rental.rentStatus || "")) {
      return { success: false, error: `Cannot delete rental with status: ${rental.rentStatus}` };
    }

    // Delete related rental_po records first (foreign key constraint)
    await prisma.rentalPo.deleteMany({
      where: { rentalId },
    });

    // Delete the rental
    await prisma.rental.delete({
      where: { rentalId },
    });

    revalidatePath("/es/rentals");
    revalidatePath("/rc/rentals");
    revalidatePath("/rc/dashboard");
    revalidatePath("/es/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting rental:", error);
    return { success: false, error: "Failed to delete rental request" };
  }
}

// Deny rental request (RC user denies a rental)
export async function denyRental(rentalId: number, denialReason?: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user has permission (RC role or higher)
  const allowedRoles = ["RC", "Manager", "ADMIN"];
  if (!session.user.role || !allowedRoles.includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    const rental = await prisma.rental.update({
      where: { rentalId },
      data: {
        rentStatus: "Denied",
        spclInst: denialReason 
          ? `[DENIED]: ${denialReason}`
          : "[DENIED] - Rental request was denied",
        lastUpdtBy: session.user.id,
        lastUpdtDt: new Date(),
      },
    });

    // Record status history: Denied
    try {
      await prisma.rentalStatusHistory.create({
        data: {
          rentalId,
          status: "Denied",
          actorId: session.user.id,
          actorName: (session.user.name as string) || null,
          note: denialReason,
        },
      });
    } catch (histError) {
      console.error("Error recording denial history:", histError);
    }

    revalidatePath("/rc/rentals");
    revalidatePath(`/rc/rentals/${rentalId}`);
    revalidatePath("/rc/dashboard");
    revalidatePath("/es/rentals");
    revalidatePath(`/es/rentals/${rentalId}`);
    revalidatePath("/es/dashboard");
    return { success: true, data: rental };
  } catch (error) {
    console.error("Error denying rental:", error);
    return { success: false, error: "Failed to deny rental request" };
  }
}

// Update and resubmit rental request (ES user modifying denied rental)
export async function updateAndResubmitRental(rentalId: number, data: any) {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get the rental to check ownership and status
    const existingRental = await prisma.rental.findUnique({
      where: { rentalId },
      select: {
        rqstBy: true,
        rentStatus: true,
      },
    });

    if (!existingRental) {
      return { success: false, error: "Rental not found" };
    }

    // Check if user owns the rental
    const userId = session.user.name || session.user.id;
    const isOwner = existingRental.rqstBy === userId;
    const isAdmin = ["Manager", "ADMIN"].includes(session.user.role || "");

    if (!isOwner && !isAdmin) {
      return { success: false, error: "You don't have permission to edit this rental" };
    }

    // Only allow update if status is Denied
    if (existingRental.rentStatus !== "Denied") {
      return { success: false, error: "Only denied rentals can be modified and resubmitted" };
    }

    // Update the rental with new data
    const rental = await prisma.rental.update({
      where: { rentalId },
      data: {
        sectId: data.sectId,
        distNbr: data.distNbr,
        nigpCd: data.nigpCd,
        submitDt: new Date(), // Update submission date
        rentStatus: "Submitted", // Reset status to Submitted
        dlvryRqstDt: data.dlvryRqstDt ? new Date(data.dlvryRqstDt) : null,
        durLngth: data.durLngth,
        durUom: data.durUom,
        eqpmtModel: data.eqpmtModel,
        eqpmtMake: data.eqpmtMake,
        eqpmtCmnt: data.eqpmtCmnt,
        eqpmtAtchmt: data.eqpmtAtchmt,
        eqpmtQty: data.eqpmtQty,
        dlvryLocn: data.dlvryLocn,
        pocNm: data.pocNm,
        pocPhnNbr: data.pocPhnNbr,
        // Chartfields
        cfDeptNbr: data.cfDeptNbr,
        cfAcctNbr: data.cfAcctNbr,
        cfAppropYr: data.cfAppropYr,
        cfAppropClass: data.cfAppropClass,
        cfFund: data.cfFund,
        cfBusUnit: data.cfBusUnit,
        cfProj: data.cfProj,
        cfActv: data.cfActv,
        cfSrcType: data.cfSrcType,
        cfTask: data.cfTask,
        spclInst: data.spclInst, // Clear the denial reason
        lastUpdtBy: session.user.id,
        lastUpdtDt: new Date(),
      },
      include: {
        district: true,
        section: true,
        nigp: true,
      },
    });

    // Record status history: Resubmitted
    try {
      await prisma.rentalStatusHistory.create({
        data: {
          rentalId,
          status: "Resubmitted",
          actorId: session.user.id,
          actorName: (session.user.name as string) || null,
          note: "Rental updated and resubmitted",
        },
      });
    } catch (histError) {
      console.error("Error recording resubmission history:", histError);
    }

    // Send email notification to RC users
    try {
      const rcUsers = await prisma.user.findMany({
        where: {
          usrRole: "RC",
          usrEmail: { not: null },
        },
        select: {
          usrEmail: true,
        },
      });

      const rcEmails = rcUsers
        .map((user) => user.usrEmail)
        .filter((email): email is string => email !== null);

      if (rcEmails.length > 0) {
        const approvalLink = `${process.env.NEXTAUTH_URL || "http://localhost:3100"}/rc/rentals/${rental.rentalId}`;
        
        await sendRentalApprovalNotification(rcEmails, {
          rentalId: rental.rentalId,
          requestedBy: rental.rqstBy || "Unknown",
          district: rental.district.distNm,
          section: rental.section.sectNm || "N/A",
          equipmentType: rental.nigp?.dscr || "N/A",
          deliveryDate: rental.dlvryRqstDt
            ? new Date(rental.dlvryRqstDt).toLocaleDateString()
            : undefined,
          deliveryLocation: rental.dlvryLocn || undefined,
          approvalLink,
        });
        
        console.log(`Rental resubmission notification sent to ${rcEmails.length} RC users`);
      } else {
        console.warn("No RC users with email addresses found for notification");
      }
    } catch (emailError) {
      console.error("Error sending rental notification email:", emailError);
    }

    revalidatePath("/es/rentals");
    revalidatePath(`/es/rentals/${rentalId}`);
    revalidatePath("/es/dashboard");
    revalidatePath("/rc/rentals");
    revalidatePath("/rc/dashboard");
    return { success: true, data: serializeDecimal(rental) };
  } catch (error) {
    console.error("Error updating rental:", error);
    return { success: false, error: "Failed to update rental request" };
  }
}
