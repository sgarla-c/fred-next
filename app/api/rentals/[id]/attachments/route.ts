import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

// GET - Retrieve attachments for a rental
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const rentalId = parseInt(id);
    if (isNaN(rentalId)) {
      return NextResponse.json({ error: "Invalid rental ID" }, { status: 400 });
    }

    const attachments = await prisma.rentalAttachment.findMany({
      where: { rentalId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

// POST - Upload a new attachment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const rentalId = parseInt(id);
    if (isNaN(rentalId)) {
      return NextResponse.json({ error: "Invalid rental ID" }, { status: 400 });
    }

    // Verify rental exists
    const rental = await prisma.rental.findUnique({
      where: { rentalId },
    });

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "rentals", rentalId.toString());
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.substring(originalName.lastIndexOf("."));
    const safeName = originalName
      .substring(0, originalName.lastIndexOf("."))
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${safeName}_${timestamp}${extension}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    // Create database record
    const fileUrl = `/uploads/rentals/${rentalId}/${fileName}`;
    const attachment = await prisma.rentalAttachment.create({
      data: {
        rentalId,
        fileName: originalName,
        fileSize: file.size,
        fileMimeType: file.type,
        fileUrl,
        uploadedBy: session.user?.id,
        uploadedByName: session.user?.name || null,
      },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json(
        { error: "Attachment ID required" },
        { status: 400 }
      );
    }

    const attachment = await prisma.rentalAttachment.findUnique({
      where: { attachmentId: parseInt(attachmentId) },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    const filePath = join(process.cwd(), "public", attachment.fileUrl);
    try {
      const fs = await import("fs/promises");
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue even if file deletion fails
    }

    // Delete database record
    await prisma.rentalAttachment.delete({
      where: { attachmentId: parseInt(attachmentId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
