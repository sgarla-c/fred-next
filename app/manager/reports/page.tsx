import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ManagerReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
        <p className="text-gray-600 mt-2">View system-wide reports and analytics</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            System Reports - Coming Soon
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            This feature will provide comprehensive system-wide reports and analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
