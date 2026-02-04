"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteRental } from "@/app/actions/rental";
import { toast } from "sonner";

interface DeleteRentalButtonProps {
  rentalId: number;
  currentStatus: string;
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DeleteRentalButton({
  rentalId,
  currentStatus,
  variant = "destructive",
  size = "default",
}: DeleteRentalButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Only show for Submitted or Pending status
  const allowedStatuses = ["Submitted", "Pending"];
  if (!allowedStatuses.includes(currentStatus)) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteRental(rentalId);

      if (result.success) {
        toast.success("Rental request deleted successfully");
        setOpen(false);
        // Redirect to rentals list after deletion
        router.push("/es/rentals");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete rental request");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Delete rental error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isDeleting}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Request
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Rental Request?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this rental request? This action cannot be undone.
            The rental request will be permanently removed from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete Request"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
