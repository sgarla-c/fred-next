"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateRentalStatus } from "@/app/actions/rental";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
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
import { toast } from "sonner";

interface ProcessRentalButtonProps {
  rentalId: number;
  currentStatus: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ProcessRentalButton({
  rentalId,
  currentStatus,
  variant = "default",
  size = "sm",
  className = "",
}: ProcessRentalButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const result = await updateRentalStatus(rentalId, "Active");
      if (result.success) {
        toast.success("Rental Processed", {
          description: `Rental #${rentalId} has been approved and is now active.`,
        });
        router.refresh();
      } else {
        toast.error("Error", {
          description: result.error || "Failed to process rental",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't show button if rental is already processed
  if (currentStatus !== "Submitted" && currentStatus !== "Pending") {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Process
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Process Rental Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to approve and activate rental #{rentalId}? This will change
            the status from "{currentStatus}" to "Active".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleProcess} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Approve & Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
