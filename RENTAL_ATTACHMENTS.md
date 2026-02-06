/**
 * Rental Attachment Feature Summary
 * 
 * This feature adds the ability to upload, view, and delete attachments for rental requests.
 * 
 * Key Components:
 * 
 * 1. Database Schema (prisma/schema.prisma)
 *    - Added RentalAttachment model with fields for file metadata
 *    - Created relation between Rental and RentalAttachment
 *    - Migration: 20260204202356_add_rental_attachments
 * 
 * 2. API Endpoints (app/api/rentals/[id]/attachments/route.ts)
 *    - GET: Fetch all attachments for a rental
 *    - POST: Upload a new attachment (max 10MB)
 *    - DELETE: Remove an attachment
 *    - Supported file types: PDF, Images (JPG, PNG, GIF), Word, Excel, Text
 * 
 * 3. UI Component (components/rental-attachments.tsx)
 *    - File upload with drag-and-drop support
 *    - List of attachments with download and delete options
 *    - File size validation and type checking
 *    - Visual feedback for upload/delete operations
 * 
 * 4. Integration
 *    - ES Rentals Detail Page: Full upload/download/delete capabilities
 *    - RC Rentals Detail Page: Full upload/download/delete capabilities
 *    - Manager Rentals Detail Page: Read-only view of attachments
 * 
 * 5. File Storage
 *    - Files stored in: public/uploads/rentals/{rentalId}/
 *    - Unique filenames with timestamps to prevent collisions
 *    - Accessible via web URLs for download
 * 
 * Usage:
 * - Users can upload attachments when viewing rental details
 * - Attachments are associated with specific rental requests
 * - RC coordinators can manage attachments when processing rentals
 * - Managers can view attachments but cannot upload/delete
 * 
 * Security:
 * - Authentication required for all operations
 * - File size limited to 10MB
 * - File type validation (whitelist approach)
 * - Cascade delete: attachments removed when rental is deleted
 */

// Example TypeScript types for attachments:
export interface RentalAttachment {
  attachmentId: number;
  rentalId: number;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  fileUrl: string;
  uploadedBy: string | null;
  uploadedByName: string | null;
  uploadedAt: Date;
}

// Allowed MIME types
export const ALLOWED_FILE_TYPES = [
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

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
