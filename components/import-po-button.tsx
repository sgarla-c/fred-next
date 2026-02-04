"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { queryPeopleSoftPO, importPOFromPeopleSoft } from "@/app/actions/purchaseOrders";
import { useRouter } from "next/navigation";

export function ImportPOButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [businessUnit, setBusinessUnit] = useState("60144");
  const [poId, setPOId] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleQuery = async () => {
    if (!businessUnit || !poId) {
      setError("Please enter both Business Unit and PO ID");
      return;
    }

    setLoading(true);
    setError("");
    setPreview(null);

    try {
      const result = await queryPeopleSoftPO(businessUnit, poId);

      if (!result.success) {
        setError(result.error || "Failed to query PO");
        return;
      }

      setPreview(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query PO");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!businessUnit || !poId) {
      setError("Please enter both Business Unit and PO ID");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await importPOFromPeopleSoft(businessUnit, poId);

      if (!result.success) {
        setError(result.error || "Failed to import PO");
        return;
      }

      setSuccess(result.message || "PO imported successfully");
      
      // Reset form after success
      setTimeout(() => {
        setOpen(false);
        setPreview(null);
        setPOId("");
        setSuccess("");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import PO");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setError("");
    setSuccess("");
    setPOId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Import from PeopleSoft
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import PO from PeopleSoft</DialogTitle>
          <DialogDescription>
            Query and import purchase order data from the TxDOT PeopleSoft system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessUnit">Business Unit</Label>
              <Input
                id="businessUnit"
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
                placeholder="e.g., 60144"
                disabled={loading || !!preview}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poId">PO ID</Label>
              <Input
                id="poId"
                value={poId}
                onChange={(e) => setPOId(e.target.value)}
                placeholder="e.g., 0000079262"
                disabled={loading || !!preview}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !preview) handleQuery();
                }}
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Preview Section */}
          {preview && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <h4 className="font-semibold text-sm">PO Preview:</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="font-medium">PO ID:</span>{" "}
                  {preview.transformed.poId}
                </div>
                <div>
                  <span className="font-medium">Release #:</span>{" "}
                  {preview.transformed.poRlseNbr}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  {preview.transformed.poStatus}
                </div>
                <div>
                  <span className="font-medium">Type:</span>{" "}
                  {preview.transformed.poType}
                </div>
                <div>
                  <span className="font-medium">Vendor ID:</span>{" "}
                  {preview.transformed.vendrNm}
                </div>
                <div>
                  <span className="font-medium">Business Unit:</span>{" "}
                  {preview.transformed.poBuNbr}
                </div>
                <div>
                  <span className="font-medium">Amount:</span> $
                  {preview.transformed.mnthEqRate?.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Start Date:</span>{" "}
                  {preview.transformed.poStartDt
                    ? new Date(preview.transformed.poStartDt).toLocaleDateString()
                    : "—"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <span className="font-medium">Description:</span>{" "}
                {preview.raw["B.DESCR254_MIXED"]}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!preview ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleQuery} disabled={loading || !businessUnit || !poId}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Query PO
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleReset}>
                Query Different PO
              </Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import to FRED
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
