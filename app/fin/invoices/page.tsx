import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function FINInvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
        <p className="text-gray-600 mt-2">Process and manage equipment rental invoices</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Invoice Management - Coming Soon
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            This feature will allow you to enter, process, and track invoices for equipment rentals.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
