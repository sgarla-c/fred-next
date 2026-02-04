"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VendorDetailsDialogProps {
  vendorId: string;
  setId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorDetailsDialog({
  vendorId,
  setId = "60100",
  open,
  onOpenChange,
}: VendorDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vendorData, setVendorData] = useState<any>(null);

  const handleLoad = async () => {
    if (!vendorId) return;

    setLoading(true);
    setError("");
    setVendorData(null);

    try {
      const response = await fetch("/api/peoplesoft/query-vendor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ setId, vendorId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to query vendor");
      }

      const data = await response.json();
      setVendorData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query vendor");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load when dialog opens
  if (open && !vendorData && !loading && !error) {
    handleLoad();
  }

  const vendor = vendorData?.data?.query?.rows?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Vendor Details
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </DialogTitle>
          <DialogDescription>
            Vendor information from PeopleSoft - Vendor ID: {vendorId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading vendor details...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {vendor && (
            <>
              {/* Vendor Information */}
              <div className="border rounded-lg p-4 space-y-3 bg-card">
                <h4 className="font-semibold">Vendor Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground text-xs">Vendor ID</Label>
                    <p className="font-medium text-base">{vendor["A.VENDOR_ID"] || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Set ID</Label>
                    <p className="font-medium text-base">{vendor["A.SETID"] || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    <p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vendor["A.VENDOR_STATUS"] === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {vendor["A.VENDOR_STATUS"] || "—"}
                      </span>
                    </p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label className="text-muted-foreground text-xs">Vendor Name</Label>
                    <p className="font-medium text-base">{vendor["A.NAME1"] || "—"}</p>
                    {vendor["A.NAME2"] && (
                      <p className="text-sm text-muted-foreground">{vendor["A.NAME2"]}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Vendor Type</Label>
                    <p className="font-medium">{vendor["A.VNDR_TYPE"] || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Vendor Class</Label>
                    <p className="font-medium">{vendor["A.VNDR_CLASS"] || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Tax ID</Label>
                    <p className="font-medium">{vendor["A.TAX_ID"] || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Locations Section - Expandable */}
              <details className="border rounded-lg p-4 bg-card" open>
                <summary className="cursor-pointer font-semibold mb-4 flex items-center gap-2">
                  Vendor Locations & Addresses
                  <span className="text-xs text-muted-foreground font-normal">
                    (Click to expand/collapse)
                  </span>
                </summary>
                <div className="space-y-4 mt-4">
                  {/* Primary Location */}
                  <div className="border-l-4 border-blue-500 pl-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-sm">Primary Location</h5>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {vendor["A.VNDR_LOC"] || "Main"}
                      </span>
                    </div>
                    
                    {/* Address */}
                    {(vendor["B.ADDRESS1"] || vendor["B.CITY"] || vendor["B.STATE"]) && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs">Address</Label>
                        <div className="text-sm space-y-1">
                          {vendor["B.ADDRESS1"] && <p className="font-medium">{vendor["B.ADDRESS1"]}</p>}
                          {vendor["B.ADDRESS2"] && <p>{vendor["B.ADDRESS2"]}</p>}
                          {vendor["B.ADDRESS3"] && <p>{vendor["B.ADDRESS3"]}</p>}
                          {vendor["B.ADDRESS4"] && <p>{vendor["B.ADDRESS4"]}</p>}
                          {(vendor["B.CITY"] || vendor["B.STATE"] || vendor["B.POSTAL"]) && (
                            <p className="font-medium">
                              {vendor["B.CITY"]}
                              {vendor["B.STATE"] && `, ${vendor["B.STATE"]}`}
                              {vendor["B.POSTAL"] && ` ${vendor["B.POSTAL"]}`}
                            </p>
                          )}
                          {vendor["B.COUNTRY"] && (
                            <p className="text-muted-foreground">{vendor["B.COUNTRY"]}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vendor["C.PHONE"] && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Phone</Label>
                          <p className="font-medium">{vendor["C.PHONE"]}</p>
                        </div>
                      )}
                      {vendor["C.FAX"] && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Fax</Label>
                          <p className="font-medium">{vendor["C.FAX"]}</p>
                        </div>
                      )}
                      {vendor["C.EMAIL_ADDR"] && (
                        <div className="md:col-span-2">
                          <Label className="text-muted-foreground text-xs">Email</Label>
                          <p className="font-medium text-blue-600">{vendor["C.EMAIL_ADDR"]}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Location Info */}
                  {vendor["B.ADDRESS_TYPE"] && (
                    <div className="text-xs text-muted-foreground">
                      Address Type: {vendor["B.ADDRESS_TYPE"]}
                    </div>
                  )}
                </div>
              </details>

              {/* Additional Details - Expandable */}
              <details className="border rounded-lg p-4 bg-card">
                <summary className="cursor-pointer font-semibold mb-4 flex items-center gap-2">
                  Additional Details
                  <span className="text-xs text-muted-foreground font-normal">
                    (Click to expand/collapse)
                  </span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mt-4">
                  {vendor["A.DUNS_NBR"] && (
                    <div>
                      <Label className="text-muted-foreground text-xs">DUNS Number</Label>
                      <p className="font-medium">{vendor["A.DUNS_NBR"]}</p>
                    </div>
                  )}
                  {vendor["A.VNDR_SIZE"] && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Vendor Size</Label>
                      <p className="font-medium">{vendor["A.VNDR_SIZE"]}</p>
                    </div>
                  )}
                  {vendor["A.MIN_ORDER_AMT"] && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Min Order Amount</Label>
                      <p className="font-medium">${parseFloat(vendor["A.MIN_ORDER_AMT"]).toLocaleString()}</p>
                    </div>
                  )}
                  {vendor["A.PAYMENT_TERMS"] && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Payment Terms</Label>
                      <p className="font-medium">{vendor["A.PAYMENT_TERMS"]}</p>
                    </div>
                  )}
                  {vendor["A.REMIT_VENDOR_ID"] && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Remit Vendor ID</Label>
                      <p className="font-medium">{vendor["A.REMIT_VENDOR_ID"]}</p>
                    </div>
                  )}
                </div>
              </details>

              {/* Raw JSON Data */}
              <details className="border rounded-lg p-4">
                <summary className="cursor-pointer font-semibold text-sm mb-3">
                  Raw JSON Response
                </summary>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(vendorData, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {error && (
            <Button onClick={handleLoad}>
              Retry
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
