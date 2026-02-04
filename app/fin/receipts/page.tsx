import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function FINReceiptsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Receipt Lookup</h1>
        <p className="text-gray-600 mt-2">Search and view receipt information</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Receipt Lookup - Coming Soon
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            This feature will allow you to search and view receipt details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
