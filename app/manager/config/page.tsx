import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function ManagerConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-600 mt-2">Manage system settings and configuration</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Configuration - Coming Soon
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            This feature will allow you to manage dropdown lists, budgets, and other system configurations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
