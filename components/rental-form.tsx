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
      
      if (isEdit && existingRental?.rentalId) {
        // Update existing rental
        result = await updateAndResubmitRental(existingRental.rentalId, data);
        
        if (result.success) {
          toast.success("Rental request updated and resubmitted successfully!");
          router.push(`/es/rentals/${existingRental.rentalId}`);
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update rental request");
        }
      } else {
        // Submit new rental
        result = await submitRental(data);
        
        if (result.success) {
          toast.success("Rental request submitted successfully!");
          router.push("/es/rentals");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to submit rental request");
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* District and Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distNbr">District *</Label>
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

        <div className="space-y-2">
          <Label htmlFor="sectId">Section *</Label>
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

      {/* Equipment Selection */}
      <div className="space-y-2">
        <Label htmlFor="nigpCd">Equipment Type (NIGP) *</Label>
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

      {/* Equipment Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eqpmtQty">Quantity *</Label>
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

        <div className="space-y-2">
          <Label htmlFor="eqpmtMake">Make</Label>
          <Input id="eqpmtMake" {...register("eqpmtMake")} placeholder="Optional" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="eqpmtModel">Model</Label>
          <Input id="eqpmtModel" {...register("eqpmtModel")} placeholder="Optional" />
        </div>
      </div>

      {/* Duration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dlvryRqstDt">Delivery Date *</Label>
          <Input
            id="dlvryRqstDt"
            type="date"
            {...register("dlvryRqstDt")}
          />
          {errors.dlvryRqstDt && (
            <p className="text-sm text-red-600">{errors.dlvryRqstDt.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="durLngth">Duration *</Label>
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

        <div className="space-y-2">
          <Label htmlFor="durUom">Unit *</Label>
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
      </div>

      {/* Delivery Location */}
      <div className="space-y-2">
        <Label htmlFor="dlvryLocn">Delivery Location *</Label>
        <Input
          id="dlvryLocn"
          {...register("dlvryLocn")}
          placeholder="Street address, city, etc."
        />
        {errors.dlvryLocn && (
          <p className="text-sm text-red-600">{errors.dlvryLocn.message}</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pocNm">Contact Name *</Label>
          <Input id="pocNm" {...register("pocNm")} />
          {errors.pocNm && (
            <p className="text-sm text-red-600">{errors.pocNm.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pocPhnNbr">Contact Phone *</Label>
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
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Chartfield Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cfDeptNbr">Department Number</Label>
            <Input id="cfDeptNbr" {...register("cfDeptNbr")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfAcctNbr">Account Number</Label>
            <Input id="cfAcctNbr" {...register("cfAcctNbr")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfAppropYr">Appropriation Year</Label>
            <Input id="cfAppropYr" {...register("cfAppropYr")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfFund">Fund</Label>
            <Input id="cfFund" {...register("cfFund")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfBusUnit">Business Unit</Label>
            <Input id="cfBusUnit" {...register("cfBusUnit")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfProj">Project</Label>
            <Input id="cfProj" {...register("cfProj")} />
          </div>
        </div>
      </div>

      {/* Special Instructions */}
      <div className="space-y-2">
        <Label htmlFor="spclInst">Special Instructions</Label>
        <textarea
          id="spclInst"
          {...register("spclInst")}
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Any special instructions or comments..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
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
