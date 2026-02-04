import * as z from "zod";

export const rentalFormSchema = z.object({
  // Location
  distNbr: z.number().min(1, "District is required"),
  sectId: z.number().min(1, "Section is required"),
  
  // Equipment
  nigpCd: z.string().min(1, "Equipment type is required"),
  eqpmtQty: z.number().min(1, "Quantity must be at least 1").default(1),
  eqpmtMake: z.string().optional(),
  eqpmtModel: z.string().optional(),
  eqpmtCmnt: z.string().optional(),
  
  // Duration
  dlvryRqstDt: z.string().min(1, "Delivery date is required"),
  durLngth: z.number().min(1, "Duration is required"),
  durUom: z.string().min(1, "Duration unit is required"),
  
  // Location
  dlvryLocn: z.string().min(1, "Delivery location is required"),
  
  // Contact
  pocNm: z.string().min(1, "Contact name is required"),
  pocPhnNbr: z.string().min(1, "Contact phone is required"),
  
  // Chartfields (10 fields - can be auto-populated)
  cfDeptNbr: z.string().optional(),
  cfAcctNbr: z.string().optional(),
  cfAppropYr: z.string().optional(),
  cfAppropClass: z.string().optional(),
  cfFund: z.string().optional(),
  cfBusUnit: z.string().optional(),
  cfProj: z.string().optional(),
  cfActv: z.string().optional(),
  cfSrcType: z.string().optional(),
  cfTask: z.string().optional(),
  
  // Special Instructions
  spclInst: z.string().optional(),
});

export type RentalFormData = z.infer<typeof rentalFormSchema>;
