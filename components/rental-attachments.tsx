"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, FileText, Download, Loader2 } from "lucide-react";

interface Attachment {
  attachmentId: number;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  fileUrl: string;
  uploadedBy: string | null;
  uploadedByName: string | null;
  uploadedAt: string;
}

interface RentalAttachmentsProps {
  rentalId: number;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  readOnly?: boolean;
}

export function RentalAttachments({
  rentalId,
  attachments = [],
  onAttachmentsChange,
  readOnly = false,
}: RentalAttachmentsProps) {
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>(attachments);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
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

    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not allowed. Please upload PDF, images, Word, Excel, or text files.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/rentals/${rentalId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { attachment } = await response.json();
      const updatedAttachments = [...currentAttachments, attachment];
      setCurrentAttachments(updatedAttachments);
      
      if (onAttachmentsChange) {
        onAttachmentsChange(updatedAttachments);
      }

      toast.success("File uploaded successfully");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    setDeleting(attachmentId);

    try {
      const response = await fetch(
        `/api/rentals/${rentalId}/attachments?attachmentId=${attachmentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Delete failed");
      }

      const updatedAttachments = currentAttachments.filter(
        (att) => att.attachmentId !== attachmentId
      );
      setCurrentAttachments(updatedAttachments);
      
      if (onAttachmentsChange) {
        onAttachmentsChange(updatedAttachments);
      }

      toast.success("Attachment deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete attachment");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Attachments</Label>
        
        {!readOnly && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500">
              Max 10MB • PDF, Images, Word, Excel, Text
            </p>
          </div>
        )}
      </div>

      {currentAttachments.length > 0 && (
        <div className="border rounded-md divide-y">
          {currentAttachments.map((attachment) => (
            <div
              key={attachment.attachmentId}
              className="p-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.fileSize)}
                    {attachment.uploadedByName && (
                      <> • Uploaded by {attachment.uploadedByName}</>
                    )}
                    {" • "}
                    {new Date(attachment.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment.fileUrl, attachment.fileName)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment.attachmentId)}
                    disabled={deleting === attachment.attachmentId}
                    title="Delete"
                  >
                    {deleting === attachment.attachmentId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentAttachments.length === 0 && (
        <p className="text-sm text-gray-500 italic">No attachments</p>
      )}
    </div>
  );
}
