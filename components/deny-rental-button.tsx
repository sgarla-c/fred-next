"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { denyRental } from "@/app/actions/rental";
import { toast } from "sonner";

interface DenyRentalButtonProps {
  rentalId: number;
  currentStatus: string;
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DenyRentalButton({
  rentalId,
  currentStatus,
  variant = "destructive",
  size = "default",
}: DenyRentalButtonProps) {
  const [isDenying, setIsDenying] = useState(false);
  const [open, setOpen] = useState(false);
  const [denialReason, setDenialReason] = useState("");
  const router = useRouter();

  // Only show for Submitted or Pending status
  const allowedStatuses = ["Submitted", "Pending"];
  if (!allowedStatuses.includes(currentStatus)) {
    return null;
  }

  const handleDeny = async () => {
    setIsDenying(true);

    try {
      const result = await denyRental(rentalId, denialReason);

      if (result.success) {
        toast.success("Rental request denied successfully");
        setOpen(false);
        setDenialReason(""); // Reset reason
        router.refresh();
      } else {
        toast.error(result.error || "Failed to deny rental request");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Deny rental error:", error);
    } finally {
      setIsDenying(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isDenying}>
          <XCircle className="h-4 w-4 mr-2" />
          Deny Request
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deny Rental Request?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deny this rental request? The equipment specialist
            will be able to modify and resubmit the request.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <label htmlFor="denial-reason" className="text-sm font-medium mb-2 block">
            Reason for Denial (Optional)
          </label>
          <Textarea
            id="denial-reason"
            placeholder="Explain why this rental request is being denied..."
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            rows={4}
            disabled={isDenying}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDenying}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeny}
            disabled={isDenying}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDenying ? "Denying..." : "Deny Request"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
