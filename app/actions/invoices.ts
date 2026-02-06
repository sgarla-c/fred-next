"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
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

// Fetch all invoices with related data
export async function getInvoices(filters?: {
  status?: string;
  limit?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const invoicesData = await prisma.invoice.findMany({
      where: filters?.status ? { invcStat: filters.status } : undefined,
      include: {
        invoiceLines: {
          include: {
            purchaseOrder: {
              select: {
                poRlseNbr: true,
                vendrNm: true,
              },
            },
            rental: {
              select: {
                rentalId: true,
                nigpCd: true,
                nigp: {
                  select: {
                    dscr: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { invcDt: "desc" },
      take: filters?.limit || 100,
    });

    // Serialize Decimal fields
    const invoices = invoicesData.map(serializeDecimal);

    return { success: true, data: invoices };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return { success: false, error: "Failed to fetch invoices" };
  }
}

// Fetch a single invoice by ID
export async function getInvoiceById(invcId: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const invoiceData = await prisma.invoice.findUnique({
      where: { invcId },
      include: {
        invoiceLines: {
          include: {
            purchaseOrder: {
              select: {
                poId: true,
                poRlseNbr: true,
                vendrNm: true,
                poStatus: true,
              },
            },
            rental: {
              select: {
                rentalId: true,
                nigpCd: true,
                rentStatus: true,
                rqstBy: true,
                district: {
                  select: {
                    distNm: true,
                  },
                },
                section: {
                  select: {
                    sectNm: true,
                  },
                },
                nigp: {
                  select: {
                    dscr: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoiceData) {
      return { success: false, error: "Invoice not found" };
    }

    // Serialize Decimal fields
    const invoice = serializeDecimal(invoiceData);

    return { success: true, data: invoice };
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return { success: false, error: "Failed to fetch invoice" };
  }
}

// Get invoice statistics
export async function getInvoiceStats() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const [total, pending, processed, complete] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { invcStat: "PENDING" } }),
      prisma.invoice.count({ where: { invcStat: "PROCESSED" } }),
      prisma.invoice.count({ where: { invcStat: "COMPLETE" } }),
    ]);

    return {
      success: true,
      data: {
        total,
        pending,
        processed,
        complete,
      },
    };
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    return { success: false, error: "Failed to fetch invoice statistics" };
  }
}

// Get invoice lines for a specific rental
export async function getInvoiceLinesByRental(rentalId: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const invoiceLinesData = await prisma.invoiceLine.findMany({
      where: { rentalId },
      include: {
        invoice: {
          select: {
            invcId: true,
            invcNbr: true,
            invcDt: true,
            invcStat: true,
          },
        },
        purchaseOrder: {
          select: {
            poRlseNbr: true,
            vendrNm: true,
          },
        },
      },
      orderBy: { invcLnId: "desc" },
    });

    // Serialize Decimal fields
    const invoiceLines = invoiceLinesData.map(serializeDecimal);

    return { success: true, data: invoiceLines };
  } catch (error) {
    console.error("Error fetching invoice lines:", error);
    return { success: false, error: "Failed to fetch invoice lines" };
  }
}
