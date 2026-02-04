"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { linkPOToRental, unlinkPOFromRental } from "@/app/actions/purchaseOrders";
import { Plus, X, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LinkedRental {
  rentalId: number;
  rqstBy: string | null;
  rentStatus: string | null;
  district: {
    distNm: string;
  };
  nigp: {
    dscr: string | null;
  } | null;
}

interface AvailableRental {
  rentalId: number;
  rqstBy: string | null;
  rentStatus: string | null;
  submitDt: Date | null;
  district: {
    distNm: string;
  };
  section: {
    sectNm: string | null;
  };
  nigp: {
    dscr: string | null;
  } | null;
}

interface RentalLinkManagerProps {
  poId: number;
  linkedRentals: LinkedRental[];
  availableRentals: AvailableRental[];
}

export function RentalLinkManager({
  poId,
  linkedRentals,
  availableRentals,
}: RentalLinkManagerProps) {
  const router = useRouter();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLinkRental = async (rentalId: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await linkPOToRental(poId, rentalId);

      if (result.success) {
        setShowLinkDialog(false);
        setSearchTerm("");
        router.refresh();
      } else {
        setError(result.error || "Failed to link rental");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkRental = async (rentalId: number) => {
    if (!confirm("Are you sure you want to unlink this rental from the PO?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await unlinkPOFromRental(poId, rentalId);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Failed to unlink rental");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = availableRentals.filter((rental) => {
    const search = searchTerm.toLowerCase();
    return (
      rental.rentalId.toString().includes(search) ||
      rental.rqstBy?.toLowerCase().includes(search) ||
      rental.district.distNm.toLowerCase().includes(search) ||
      rental.nigp?.dscr?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Linked Rentals ({linkedRentals.length})</h3>
        <Button
          size="sm"
          onClick={() => setShowLinkDialog(!showLinkDialog)}
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Link Rental
        </Button>
      </div>

      {/* Linked Rentals List */}
      {linkedRentals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rentals linked to this PO</p>
      ) : (
        <div className="space-y-3">
          {linkedRentals.map((rental) => (
            <div
              key={rental.rentalId}
              className="flex items-center justify-between p-3 border rounded hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/rc/rentals/${rental.rentalId}`}
                    className="font-medium hover:underline"
                  >
                    Rental #{rental.rentalId}
                  </Link>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      rental.rentStatus === "Active"
                        ? "bg-green-100 text-green-800"
                        : rental.rentStatus === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {rental.rentStatus || "Submitted"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {rental.district.distNm}
                </p>
                <p className="text-sm text-muted-foreground">
                  {rental.nigp?.dscr || "No equipment"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnlinkRental(rental.rentalId)}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Link Rental Dialog */}
      {showLinkDialog && (
        <div className="border rounded-lg p-4 bg-muted/20 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Link Rental to PO</h3>
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
                placeholder="Search by rental ID, requester, district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredRentals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchTerm
                    ? "No rentals found matching your search"
                    : "No available rentals to link"}
                </p>
              ) : (
                filteredRentals.map((rental) => (
                  <div
                    key={rental.rentalId}
                    className="flex items-center justify-between p-3 border rounded hover:bg-background"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Rental #{rental.rentalId}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            rental.rentStatus === "Active"
                              ? "bg-green-100 text-green-800"
                              : rental.rentStatus === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {rental.rentStatus || "Submitted"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rental.district.distNm} - {rental.section.sectNm}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {rental.nigp?.dscr || "No equipment"} • {rental.rqstBy}
                      </p>
                      {rental.submitDt && (
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(rental.submitDt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleLinkRental(rental.rentalId)}
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
    </div>
  );
}
