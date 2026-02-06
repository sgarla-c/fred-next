"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface UpdateUserData {
  usrId: string;
  firstNm?: string;
  lastNm?: string;
  usrEmail?: string;
  usrRole?: string;
  usrPhnNbr?: string;
  distNbr?: number;
  sectId?: number;
}

/**
 * Update user information
 */
export async function updateUser(data: UpdateUserData) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user has Manager or ADMIN role
  if (session.user.role !== "Manager" && session.user.role !== "ADMIN") {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    const updateData: any = {
      lastUpdtBy: session.user.id,
      lastUpdtDt: new Date(),
    };

    // Update fields only if they are provided in data
    if (data.firstNm !== undefined) updateData.firstNm = data.firstNm;
    if (data.lastNm !== undefined) updateData.lastNm = data.lastNm;
    if (data.usrEmail !== undefined) updateData.usrEmail = data.usrEmail || null;
    if (data.usrRole !== undefined) updateData.usrRole = data.usrRole;
    if (data.usrPhnNbr !== undefined) updateData.usrPhnNbr = data.usrPhnNbr || null;
    if (data.distNbr !== undefined) updateData.distNbr = data.distNbr || null;
    if (data.sectId !== undefined) updateData.sectId = data.sectId || null;

    const user = await prisma.user.update({
      where: { usrId: data.usrId },
      data: updateData,
    });

    revalidatePath("/manager/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

/**
 * Reset user password
 */
export async function resetUserPassword(usrId: string, newPassword: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user has Manager or ADMIN role
  if (session.user.role !== "Manager" && session.user.role !== "ADMIN") {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { usrId },
      data: {
        password: hashedPassword,
        lastUpdtBy: session.user.id,
        lastUpdtDt: new Date(),
      },
    });

    revalidatePath("/manager/users");
    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

/**
 * Get all districts for user assignment
 */
export async function getDistricts() {
  try {
    const districts = await prisma.district.findMany({
      orderBy: { distNbr: "asc" },
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

/**
 * Get sections for a district
 */
export async function getSectionsByDistrict(distNbr: number) {
  try {
    const sections = await prisma.section.findMany({
      where: { distNbr },
      orderBy: { sectNbr: "asc" },
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
