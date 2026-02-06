"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { rentalFormSchema, type RentalFormData } from "@/lib/validations/rental";
import { submitRental, getSectionsByDistrict, updateAndResubmitRental } from "@/app/actions/rental";
import { useRouter } from "next/navigation";

interface RentalFormProps {
  districts: Array<{ distNbr: number; distNm: string }>;
  nigpCodes: Array<{ nigpCd: string; dscr: string | null; avgMonthlyRate: any }>;
  existingRental?: any;
  isEdit?: boolean;
}

export function RentalForm({ districts, nigpCodes, existingRental, isEdit = false }: RentalFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sections, setSections] = useState<Array<{ sectId: number; sectNbr: string | null; sectNm: string | null }>>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(existingRental?.distNbr || null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RentalFormData>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: existingRental || {
      eqpmtQty: 1,
      durUom: "Months",
    },
  });

  const distNbr = watch("distNbr");

  // Load sections when district changes or on mount for edit
  useEffect(() => {
    if (distNbr) {
      getSectionsByDistrict(distNbr).then((result) => {
        if (result.success && result.data) {
          setSections(result.data);
          // Don't reset section if we're editing
          if (!isEdit) {
            setValue("sectId", 0);
          }
        }
      });
    } else {
      setSections([]);
    }
  }, [distNbr, setValue, isEdit]);

  const onSubmit = async (data: RentalFormData) => {
    setIsSubmitting(true);
    
    try {
      let result;
      let rentalId: number | undefined;
      
      if (isEdit && existingRental?.rentalId) {
        // Update existing rental
        result = await updateAndResubmitRental(existingRental.rentalId, data);
        rentalId = existingRental.rentalId;
        
        if (result.success) {
          toast.success("Rental request updated successfully!");
        } else {
          toast.error(result.error || "Failed to update rental request");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Submit new rental
        result = await submitRental(data);
        
        if (result.success && result.data?.rentalId) {
          rentalId = result.data.rentalId;
          toast.success("Rental request submitted successfully!");
        } else {
          toast.error(result.error || "Failed to submit rental request");
          setIsSubmitting(false);
          return;
        }
      }

      // Upload pending files if any
      if (rentalId && pendingFiles.length > 0) {
        toast.info(`Uploading ${pendingFiles.length} attachment(s)...`);
        
        for (const file of pendingFiles) {
          try {
            const formData = new FormData();
            formData.append("file", file);
            
            const uploadResponse = await fetch(`/api/rentals/${rentalId}/attachments`, {
              method: "POST",
              body: formData,
            });
            
            if (!uploadResponse.ok) {
              console.error(`Failed to upload ${file.name}`);
            }
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
          }
        }
        
        toast.success("Attachments uploaded!");
      }

      // Navigate to the rental detail page
      router.push(`/es/rentals/${rentalId}`);
      router.refresh();
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      {/* District and Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="distNbr" className="text-xs">District *</Label>
          <Select
            onValueChange={(value) => {
              const distNum = parseInt(value);
              setValue("distNbr", distNum);
              setSelectedDistrict(distNum);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.distNbr} value={district.distNbr.toString()}>
                  {district.distNbr} - {district.distNm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.distNbr && (
            <p className="text-sm text-red-600">{errors.distNbr.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="sectId" className="text-xs">Section *</Label>
          <Select
            onValueChange={(value) => setValue("sectId", parseInt(value))}
            disabled={!selectedDistrict || sections.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section.sectId} value={section.sectId.toString()}>
                  {section.sectNbr} - {section.sectNm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sectId && (
            <p className="text-sm text-red-600">{errors.sectId.message}</p>
          )}
        </div>
      </div>

      {/* Equipment Selection and Details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="space-y-1 md:col-span-4">
          <Label htmlFor="nigpCd" className="text-xs">Equipment Type (NIGP) *</Label>
          <Select onValueChange={(value) => setValue("nigpCd", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select equipment type" />
            </SelectTrigger>
            <SelectContent>
              {nigpCodes.map((code) => (
                <SelectItem key={code.nigpCd} value={code.nigpCd}>
                  {code.nigpCd} - {code.dscr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.nigpCd && (
            <p className="text-sm text-red-600">{errors.nigpCd.message}</p>
          )}
        </div>


        <div className="space-y-1">
          <Label htmlFor="eqpmtQty" className="text-xs">Quantity *</Label>
          <Input
            id="eqpmtQty"
            type="number"
            min="1"
            {...register("eqpmtQty", { valueAsNumber: true })}
          />
          {errors.eqpmtQty && (
            <p className="text-sm text-red-600">{errors.eqpmtQty.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="eqpmtMake" className="text-xs">Make</Label>
          <Input id="eqpmtMake" {...register("eqpmtMake")} placeholder="Optional" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="eqpmtModel" className="text-xs">Model</Label>
          <Input id="eqpmtModel" {...register("eqpmtModel")} placeholder="Optional" />
        </div>
      </div>

      {/* Duration and Delivery */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="space-y-1">
          <Label htmlFor="dlvryRqstDt" className="text-xs">Delivery Date *</Label>
          <Input
            id="dlvryRqstDt"
            type="date"
            {...register("dlvryRqstDt")}
          />
          {errors.dlvryRqstDt && (
            <p className="text-sm text-red-600">{errors.dlvryRqstDt.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="durLngth" className="text-xs">Duration *</Label>
          <Input
            id="durLngth"
            type="number"
            min="1"
            {...register("durLngth", { valueAsNumber: true })}
          />
          {errors.durLngth && (
            <p className="text-sm text-red-600">{errors.durLngth.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="durUom" className="text-xs">Unit *</Label>
          <Select
            defaultValue="Months"
            onValueChange={(value) => setValue("durUom", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Days">Days</SelectItem>
              <SelectItem value="Weeks">Weeks</SelectItem>
              <SelectItem value="Months">Months</SelectItem>
            </SelectContent>
          </Select>
          {errors.durUom && (
            <p className="text-sm text-red-600">{errors.durUom.message}</p>
          )}
        </div>
        <div className="space-y-1 md:col-span-4">
          <Label htmlFor="dlvryLocn" className="text-xs">Delivery Location *</Label>
          <Input
            id="dlvryLocn"
            {...register("dlvryLocn")}
            placeholder="Street address, city, etc."
          />
          {errors.dlvryLocn && (
            <p className="text-sm text-red-600">{errors.dlvryLocn.message}</p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="pocNm" className="text-xs">Contact Name *</Label>
          <Input id="pocNm" {...register("pocNm")} />
          {errors.pocNm && (
            <p className="text-sm text-red-600">{errors.pocNm.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="pocPhnNbr" className="text-xs">Contact Phone *</Label>
          <Input
            id="pocPhnNbr"
            type="tel"
            {...register("pocPhnNbr")}
            placeholder="(XXX) XXX-XXXX"
          />
          {errors.pocPhnNbr && (
            <p className="text-sm text-red-600">{errors.pocPhnNbr.message}</p>
          )}
        </div>
      </div>

      {/* Chartfields Section */}
      <div className="border-t pt-2">
        <h3 className="text-sm font-medium mb-1">Chartfield Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label htmlFor="cfDeptNbr" className="text-xs">Dept #</Label>
            <Input id="cfDeptNbr" {...register("cfDeptNbr")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cfAcctNbr" className="text-xs">Acct #</Label>
            <Input id="cfAcctNbr" {...register("cfAcctNbr")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cfAppropYr" className="text-xs">Approp Yr</Label>
            <Input id="cfAppropYr" {...register("cfAppropYr")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cfFund" className="text-xs">Fund</Label>
            <Input id="cfFund" {...register("cfFund")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cfBusUnit" className="text-xs">Bus Unit</Label>
            <Input id="cfBusUnit" {...register("cfBusUnit")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cfProj" className="text-xs">Project</Label>
            <Input id="cfProj" {...register("cfProj")} />
          </div>
        </div>
      </div>

      {/* Special Instructions and File Attachments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="spclInst" className="text-xs">Special Instructions</Label>
          <textarea
            id="spclInst"
            {...register("spclInst")}
            className="w-full min-h-[50px] rounded-md border border-input bg-background px-2 py-1 text-sm"
            placeholder="Any special instructions or comments..."
          />
        </div>

        <div className="space-y-1">
        <Label htmlFor="attachments" className="text-xs">Attachments (Optional)</Label>
        <Input
          id="attachments"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            const validFiles = files.filter(file => {
              if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 10MB limit`);
                return false;
              }
              return true;
            });
            setPendingFiles(prev => [...prev, ...validFiles]);
          }}
          className="cursor-pointer"
        />
        {pendingFiles.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-muted-foreground">{pendingFiles.length} file(s) ready to upload:</p>
            <ul className="text-sm space-y-1">
              {pendingFiles.map((file, idx) => (
                <li key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
          <p className="text-xs text-muted-foreground">Max 10MB per file • PDF, Images, Word, Excel, Text</p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2 pt-1">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting 
            ? (isEdit ? "Updating..." : "Submitting...") 
            : (isEdit ? "Update & Resubmit" : "Submit Rental Request")}
        </Button>
      </div>
    </form>
  );
}
