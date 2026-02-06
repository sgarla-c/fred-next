"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Filter } from "lucide-react";

export function POSearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    vendor: searchParams.get("vendor") || "",
    poType: searchParams.get("poType") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
  });

  const [showAdvanced, setShowAdvanced] = useState(
    !!(searchParams.get("vendor") || searchParams.get("poType") || searchParams.get("startDate"))
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.vendor) params.set("vendor", filters.vendor);
    if (filters.poType) params.set("poType", filters.poType);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);

    startTransition(() => {
      router.push(`/rc/purchase-orders?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setFilters({
      search: "",
      status: "",
      vendor: "",
      poType: "",
      startDate: "",
      endDate: "",
    });
    startTransition(() => {
      router.push("/rc/purchase-orders");
    });
  };

  const hasActiveFilters = Object.values(filters).some((val) => val !== "");

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Quick Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by PO ID, release number, or vendor..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded"
              />
            </div>
            <Button onClick={handleSearch} disabled={isPending}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvanced ? "Hide" : "Advanced"}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Open">Open</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">PO Type</label>
                <select
                  value={filters.poType}
                  onChange={(e) => setFilters({ ...filters, poType: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">All Types</option>
                  <option value="Rent">Rent</option>
                  <option value="Journal Entry">Journal Entry</option>
                  <option value="Weather Rent">Weather Rent</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Additional Shipping">Additional Shipping</option>
                  <option value="Damage">Damage</option>
                  <option value="Tax">Tax</option>
                  <option value="Weather Misc">Weather Misc</option>
                  <option value="Weather Shipping">Weather Shipping</option>
                  <option value="Standard">Standard</option>
                  <option value="Error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Vendor</label>
                <input
                  type="text"
                  placeholder="Vendor name"
                  value={filters.vendor}
                  onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date From</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date To</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
