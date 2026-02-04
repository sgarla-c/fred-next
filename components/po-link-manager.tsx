"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { linkPOToRental, unlinkPOFromRental } from "@/app/actions/purchaseOrders";
import { Plus, X, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LinkedPO {
  poId: number;
  poRlseNbr: string | null;
  vendrNm: string | null;
  poStatus: string | null;
  mnthEqRate: any;
}

interface AvailablePO {
  poId: number;
  poRlseNbr: string | null;
  vendrNm: string | null;
  poStatus: string | null;
  poType: string | null;
  mnthEqRate: any;
}

interface POLinkManagerProps {
  rentalId: number;
  linkedPOs: LinkedPO[];
  availablePOs: AvailablePO[];
}

export function POLinkManager({ rentalId, linkedPOs, availablePOs }: POLinkManagerProps) {
  const router = useRouter();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLinkPO = async (poId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await linkPOToRental(poId, rentalId);
      
      if (result.success) {
        setShowLinkDialog(false);
        setSearchTerm("");
        router.refresh();
      } else {
        setError(result.error || "Failed to link PO");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkPO = async (poId: number) => {
    if (!confirm("Are you sure you want to unlink this PO from the rental?")) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await unlinkPOFromRental(poId, rentalId);
      
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Failed to unlink PO");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPOs = availablePOs.filter((po) => {
    const search = searchTerm.toLowerCase();
    return (
      po.poId.toString().includes(search) ||
      po.poRlseNbr?.toLowerCase().includes(search) ||
      po.vendrNm?.toLowerCase().includes(search)
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Linked Purchase Orders ({linkedPOs.length})</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowLinkDialog(!showLinkDialog)}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Link PO
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* Linked POs List */}
        {linkedPOs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No purchase orders linked to this rental
          </p>
        ) : (
          <div className="space-y-3">
            {linkedPOs.map((po) => (
              <div
                key={po.poId}
                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/rc/purchase-orders/${po.poId}`}
                      className="font-medium hover:underline"
                    >
                      PO #{po.poId}
                    </Link>
                    {po.poRlseNbr && (
                      <span className="text-sm text-muted-foreground">
                        ({po.poRlseNbr})
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        po.poStatus === "Active"
                          ? "bg-green-100 text-green-800"
                          : po.poStatus === "Open"
                          ? "bg-blue-100 text-blue-800"
                          : po.poStatus === "Closed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {po.poStatus || "Draft"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vendor: {po.vendrNm || "N/A"}
                  </p>
                  {po.mnthEqRate && (
                    <p className="text-sm text-muted-foreground">
                      Rate: ${parseFloat(po.mnthEqRate.toString()).toFixed(2)}/month
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkPO(po.poId)}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Link PO Dialog */}
        {showLinkDialog && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Link Purchase Order</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowLinkDialog(false);
                    setSearchTerm("");
                    setError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by PO ID, release number, or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredPOs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchTerm
                      ? "No purchase orders found matching your search"
                      : "No available purchase orders to link"}
                  </p>
                ) : (
                  filteredPOs.map((po) => (
                    <div
                      key={po.poId}
                      className="flex items-center justify-between p-3 border rounded hover:bg-background"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">PO #{po.poId}</span>
                          {po.poRlseNbr && (
                            <span className="text-sm text-muted-foreground">
                              ({po.poRlseNbr})
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              po.poStatus === "Active"
                                ? "bg-green-100 text-green-800"
                                : po.poStatus === "Open"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {po.poStatus || "Draft"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {po.vendrNm || "No vendor"} • {po.poType || "No type"}
                        </p>
                        {po.mnthEqRate && (
                          <p className="text-sm text-muted-foreground">
                            ${parseFloat(po.mnthEqRate.toString()).toFixed(2)}/month
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleLinkPO(po.poId)}
                        disabled={loading}
                      >
                        Link
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
