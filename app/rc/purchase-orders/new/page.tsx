import { POForm } from "@/components/po-form";

export default function NewPurchaseOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Purchase Order</h1>
        <p className="text-muted-foreground mt-2">
          Enter purchase order details and vendor information
        </p>
      </div>

      <POForm />
    </div>
  );
}
