"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import PeopleSoftClient from "@/lib/peoplesoft-client";
import { PO_STATUSES, VALID_STATUS_TRANSITIONS, type POStatus } from "@/lib/po-constants";

export interface CreatePOData {
  poRlseNbr?: string;
  poRcvdBy?: string;
  vendrNm?: string;
  userRqstViaPurchFlg?: boolean;
  poBuNbr?: string;
  eRqstnNbr?: string;
  poStatus?: string;
  poStartDt?: Date;
  poExpirDt?: Date;
  txdotGps?: boolean;
  mnthEqRate?: number;
  poType?: string;
  spclEvnt?: string;
  chartFieldsFlg?: boolean;
  vendorMail?: string;
  vendorPhnNbr?: string;
}

export interface UpdatePOData extends CreatePOData {
  poId: number;
}

/**
 * Validates if a status transition is allowed
 */
function validateStatusTransition(
  currentStatus: string | null,
  newStatus: string
): { valid: boolean; error?: string } {
  // If no current status (new PO), any status is allowed
  if (!currentStatus) {
    return { valid: true };
  }

  // Same status is always allowed (no transition)
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  const allowedStatuses = VALID_STATUS_TRANSITIONS[currentStatus];

  if (!allowedStatuses) {
    return {
      valid: false,
      error: `Invalid current status: ${currentStatus}`,
    };
  }

  if (allowedStatuses.length === 0) {
    return {
      valid: false,
      error: `Cannot change status from ${currentStatus}. This is a terminal state.`,
    };
  }

  if (!allowedStatuses.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedStatuses.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validates PO business rules before status change
 */
async function validatePOBusinessRules(
  poId: number,
  newStatus: string
): Promise<{ valid: boolean; error?: string }> {
  // Cannot close PO if it has active rentals
  if (newStatus === PO_STATUSES.CLOSED) {
    const activeRentals = await prisma.rentalPo.count({
      where: {
        poId,
        rental: {
          rentStatus: { in: ["Active", "Delivered", "Pending"] },
        },
      },
    });

    if (activeRentals > 0) {
      return {
        valid: false,
        error: `Cannot close PO. It has ${activeRentals} active rental(s). Complete or cancel all rentals first.`,
      };
    }
  }

  // Cannot activate PO without vendor
  if (newStatus === PO_STATUSES.ACTIVE) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { poId },
      select: { vendrNm: true, poRlseNbr: true },
    });

    if (!po?.vendrNm) {
      return {
        valid: false,
        error: "Cannot activate PO without a vendor name.",
      };
    }

    if (!po?.poRlseNbr) {
      return {
        valid: false,
        error: "Cannot activate PO without a PO release number.",
      };
    }
  }

  return { valid: true };
}

/**
 * Create a new Purchase Order
 */
export async function createPurchaseOrder(data: CreatePOData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        ...data,
        mnthEqRate: data.mnthEqRate ? String(data.mnthEqRate) : null,
        lastUpdtBy: session.user.id,
        lastUpdtDt: new Date(),
      },
    });

    revalidatePath("/rc/purchase-orders");
    return { success: true, data: purchaseOrder };
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return { success: false, error: "Failed to create purchase order" };
  }
}

/**
 * Update an existing Purchase Order
 */
export async function updatePurchaseOrder(data: UpdatePOData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const { poId, ...updateData } = data;

    // Get current PO to check status transition
    const currentPO = await prisma.purchaseOrder.findUnique({
      where: { poId },
      select: { poStatus: true },
    });

    if (!currentPO) {
      return { success: false, error: "Purchase order not found" };
    }

    // Validate status transition if status is being changed
    if (updateData.poStatus && updateData.poStatus !== currentPO.poStatus) {
      const transitionValidation = validateStatusTransition(
        currentPO.poStatus,
        updateData.poStatus
      );

      if (!transitionValidation.valid) {
        return {
          success: false,
          error: transitionValidation.error,
        };
      }

      // Validate business rules for the new status
      const businessRulesValidation = await validatePOBusinessRules(
        poId,
        updateData.poStatus
      );

      if (!businessRulesValidation.valid) {
        return {
          success: false,
          error: businessRulesValidation.error,
        };
      }
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { poId },
      data: {
        ...updateData,
        mnthEqRate: updateData.mnthEqRate ? String(updateData.mnthEqRate) : null,
        lastUpdtBy: session.user.id,
        lastUpdtDt: new Date(),
      },
    });

    revalidatePath("/rc/purchase-orders");
    revalidatePath(`/rc/purchase-orders/${poId}`);
    return { success: true, data: purchaseOrder };
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return { success: false, error: "Failed to update purchase order" };
  }
}

/**
 * Delete a Purchase Order
 */
export async function deletePurchaseOrder(poId: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if PO has linked rentals
    const linkedRentals = await prisma.rentalPo.count({
      where: { poId },
    });

    if (linkedRentals > 0) {
      return {
        success: false,
        error: `Cannot delete PO. It has ${linkedRentals} linked rental(s).`,
      };
    }

    await prisma.purchaseOrder.delete({
      where: { poId },
    });

    revalidatePath("/rc/purchase-orders");
    return { success: true };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return { success: false, error: "Failed to delete purchase order" };
  }
}

/**
 * Link a Purchase Order to a Rental
 */
export async function linkPOToRental(poId: number, rentalId: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if link already exists
    const existingLink = await prisma.rentalPo.findFirst({
      where: { poId, rentalId },
    });

    if (existingLink) {
      return { success: false, error: "PO is already linked to this rental" };
    }

    const rentalPo = await prisma.rentalPo.create({
      data: { poId, rentalId },
    });

    revalidatePath("/rc/purchase-orders");
    revalidatePath(`/rc/purchase-orders/${poId}`);
    revalidatePath("/rc/rentals");
    return { success: true, data: rentalPo };
  } catch (error) {
    console.error("Error linking PO to rental:", error);
    return { success: false, error: "Failed to link PO to rental" };
  }
}

/**
 * Unlink a Purchase Order from a Rental
 */
export async function unlinkPOFromRental(poId: number, rentalId: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.rentalPo.deleteMany({
      where: { poId, rentalId },
    });

    revalidatePath("/rc/purchase-orders");
    revalidatePath(`/rc/purchase-orders/${poId}`);
    revalidatePath("/rc/rentals");
    return { success: true };
  } catch (error) {
    console.error("Error unlinking PO from rental:", error);
    return { success: false, error: "Failed to unlink PO from rental" };
  }
}

/**
 * Get all distinct vendors from existing POs
 */
export async function getVendors() {
  try {
    const vendors = await prisma.purchaseOrder.findMany({
      where: {
        vendrNm: { not: null },
      },
      select: { vendrNm: true, vendorMail: true, vendorPhnNbr: true },
      distinct: ["vendrNm"],
      orderBy: { vendrNm: "asc" },
    });

    return vendors.filter((v) => v.vendrNm !== null);
  } catch (error) {
    console.error("Error getting vendors:", error);
    return [];
  }
}

/**
 * Get all distinct PO statuses
 */
export async function getPOStatuses() {
  try {
    const statuses = await prisma.purchaseOrder.findMany({
      where: {
        poStatus: { not: null },
      },
      select: { poStatus: true },
      distinct: ["poStatus"],
      orderBy: { poStatus: "asc" },
    });

    return statuses
      .map((s) => s.poStatus)
      .filter((s): s is string => s !== null);
  } catch (error) {
    console.error("Error getting PO statuses:", error);
    return Object.values(PO_STATUSES);
  }
}

/**
 * Get allowed next statuses for a PO based on current status
 */
export async function getAllowedNextStatuses(
  poId?: number,
  currentStatus?: string
): Promise<string[]> {
  // For new POs, allow Draft and Open
  if (!poId || !currentStatus) {
    return [PO_STATUSES.DRAFT, PO_STATUSES.OPEN];
  }

  // Get allowed transitions from workflow
  const allowedStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  // Always allow keeping current status
  return [currentStatus, ...allowedStatuses];
}

/**
 * Get status workflow information
 */
export async function getStatusWorkflowInfo(currentStatus?: string): Promise<{
  allowedTransitions: string[];
  isTerminal: boolean;
  nextSteps: string[];
}> {
  if (!currentStatus) {
    return {
      allowedTransitions: [PO_STATUSES.DRAFT, PO_STATUSES.OPEN],
      isTerminal: false,
      nextSteps: ["Create as Draft to continue editing", "Create as Open to submit for approval"],
    };
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  const isTerminal = allowedTransitions.length === 0;

  const nextSteps: string[] = [];
  if (currentStatus === PO_STATUSES.DRAFT) {
    nextSteps.push("Set to Open when ready for approval");
  } else if (currentStatus === PO_STATUSES.OPEN) {
    nextSteps.push("Set to Active once approved and vendor is ready");
  } else if (currentStatus === PO_STATUSES.ACTIVE) {
    nextSteps.push("Set to Closed when all work is complete");
    nextSteps.push("Set to Cancelled if PO needs to be terminated");
  }

  return {
    allowedTransitions,
    isTerminal,
    nextSteps,
  };
}

/**
 * Get all distinct PO types
 */
export async function getPOTypes() {
  try {
    const types = await prisma.purchaseOrder.findMany({
      where: {
        poType: { not: null },
      },
      select: { poType: true },
      distinct: ["poType"],
      orderBy: { poType: "asc" },
    });

    return types.map((t) => t.poType).filter((t): t is string => t !== null);
  } catch (error) {
    console.error("Error getting PO types:", error);
    return ["Standard", "Fleet", "Call-Off", "Emergency"];
  }
}

/**
 * Query PO from PeopleSoft system
 */
export async function queryPeopleSoftPO(businessUnit: string, poId: string) {
  try {
    const session = await auth();
    if (!session || !["RC", "Manager", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const client = new PeopleSoftClient();
    const result = await client.getPODetails(businessUnit, poId);

    if (!result) {
      return { success: false, error: "PO not found in PeopleSoft" };
    }

    return {
      success: true,
      data: {
        raw: result.raw,
        transformed: result.transformed,
      },
    };
  } catch (error) {
    console.error("Error querying PeopleSoft:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to query PeopleSoft",
    };
  }
}

/**
 * Import PO from PeopleSoft into FRED database
 */
export async function importPOFromPeopleSoft(businessUnit: string, poId: string) {
  try {
    const session = await auth();
    if (!session || !["RC", "Manager", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const client = new PeopleSoftClient();
    const result = await client.getPODetails(businessUnit, poId);

    if (!result) {
      return { success: false, error: "PO not found in PeopleSoft" };
    }

    const { transformed } = result;

    // Check if PO already exists
    const existing = await prisma.purchaseOrder.findUnique({
      where: { poId: transformed.poId },
    });

    if (existing) {
      return {
        success: false,
        error: `PO ${transformed.poId} already exists in FRED database`,
      };
    }

    // Create PO in FRED database
    const newPO = await prisma.purchaseOrder.create({
      data: {
        ...transformed,
        lastUpdtBy: session.user.username,
      },
    });

    revalidatePath("/rc/purchase-orders");

    return {
      success: true,
      message: `Successfully imported PO ${newPO.poId}`,
      poId: newPO.poId,
    };
  } catch (error) {
    console.error("Error importing PO from PeopleSoft:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import PO",
    };
  }
}

