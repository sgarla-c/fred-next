"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { VendorDetailsDialog } from "@/components/vendor-details-dialog";

interface POData {
  status: string;
  data: {
    query: {
      numrows: number;
      queryname: string;
      rows: any[];
    };
  };
}

export default function FINPeopleSoftQueryPage() {
  const [businessUnit, setBusinessUnit] = useState("60144");
  const [poId, setPOId] = useState("0000079262");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [poData, setPOData] = useState<POData | null>(null);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");

  const handleVendorClick = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setShowVendorDialog(true);
  };

  const handleQuery = async () => {
    if (!businessUnit || !poId) {
      setError("Please enter both Business Unit and PO ID");
      return;
    }

    setLoading(true);
    setError("");
    setPOData(null);

    try {
      const response = await fetch("/api/peoplesoft/query-po", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessUnit, poId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to query PeopleSoft");
      }

      const data = await response.json();
      setPOData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query PO");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPOData(null);
    setError("");
    setPOId("0000079262");
  };

  const po = poData?.data?.query?.rows?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">PeopleSoft PO Query</h1>
        <p className="text-gray-600 mt-2">
          Query purchase order data from TxDOT PeopleSoft system
        </p>
      </div>

      {/* Query Form */}
      <Card>
        <CardHeader>
          <CardTitle>Query PO Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessUnit">Business Unit</Label>
              <Input
                id="businessUnit"
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
                placeholder="e.g., 60144"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                TxDOT Business Unit identifier
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poId">PO ID</Label>
              <Input
                id="poId"
                value={poId}
                onChange={(e) => setPOId(e.target.value)}
                placeholder="e.g., 0000079262"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQuery();
                }}
              />
              <p className="text-xs text-muted-foreground">
                PeopleSoft Purchase Order ID
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleQuery}
              disabled={loading || !businessUnit || !poId}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Search className="h-4 w-4 mr-2" />
              Query PeopleSoft
            </Button>
            {poData && (
              <Button variant="outline" onClick={handleClear}>
                Clear Results
              </Button>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {poData && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully retrieved PO data
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {po && (
        <>
          {/* PO Header Information */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Business Unit</Label>
                  <p className="font-medium">{po["A.BUSINESS_UNIT"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">PO ID</Label>
                  <p className="font-medium">{po["A.PO_ID"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">PO Type</Label>
                  <p className="font-medium">{po["A.PO_TYPE"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        po["A.PO_STATUS"] === "Dispatched"
                          ? "bg-green-100 text-green-800"
                          : po["A.PO_STATUS"] === "Approved"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {po["A.PO_STATUS"]}
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hold Status</Label>
                  <p className="font-medium">
                    {po["A.HOLD_STATUS"] === "Y" ? "On Hold" : "Not On Hold"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Budget Status</Label>
                  <p className="font-medium">{po["A.BUDGET_HDR_STATUS"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">PO Date</Label>
                  <p className="font-medium">
                    {po["A.PO_DT"]
                      ? new Date(po["A.PO_DT"]).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Approval Date</Label>
                  <p className="font-medium">
                    {po["A.APPROVAL_DT"]
                      ? new Date(po["A.APPROVAL_DT"]).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="font-medium">
                    {po["A.LAST_DTTM_UPDATE"]
                      ? new Date(po["A.LAST_DTTM_UPDATE"]).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Vendor ID</Label>
                  <button
                    onClick={() => handleVendorClick(po["A.VENDOR_ID"])}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {po["A.VENDOR_ID"]}
                  </button>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vendor Location</Label>
                  <p className="font-medium">{po["A.VNDR_LOC"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Buyer ID</Label>
                  <p className="font-medium">{po["A.BUYER_ID"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Name</Label>
                  <p className="font-medium">{po["A.CONTACT_NAME"] || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Phone</Label>
                  <p className="font-medium">{po["A.CONTACT_PHONE"] || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Address Seq</Label>
                  <p className="font-medium">{po["A.ADDRESS_SEQ_NUM"]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Item Information */}
          <Card>
            <CardHeader>
              <CardTitle>Line Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Line Number</Label>
                    <p className="font-medium">{po["B.LINE_NBR"]}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cancel Status</Label>
                    <p className="font-medium">{po["B.CANCEL_STATUS"]}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Item ID</Label>
                    <p className="font-medium">{po["B.INV_ITEM_ID"]}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{po["B.CATEGORY_ID"]}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium">{po["B.DESCR254_MIXED"]}</p>
                  {po["B.DESCR254_MIXED2"] && (
                    <p className="text-sm mt-1">{po["B.DESCR254_MIXED2"]}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Contract ID</Label>
                    <p className="font-medium">{po["B.CNTRCT_ID"]}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Contract Category</Label>
                    <p className="font-medium">{po["B.TX_CONTRACT_CATGRY"]}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Purchase Method</Label>
                    <p className="font-medium">{po["B.TX_PURCH_METHOD"]}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">RFQ ID</Label>
                    <p className="font-medium">{po["B.RFQ_ID"] || "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Financial Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Schedule Number</Label>
                  <p className="font-medium">{po["C.SCHED_NBR"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <p className="font-medium">
                    {po["C.DUE_DT"]
                      ? new Date(po["C.DUE_DT"]).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{po["C.QTY_PO"]?.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Merchandise Amount</Label>
                  <p className="font-medium text-lg">
                    ${po["C.MERCHANDISE_AMT"]?.toLocaleString() || "0.00"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Distribution Amount</Label>
                  <p className="font-medium">
                    ${po["D.MERCHANDISE_AMT"]?.toLocaleString() || "0.00"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Base Amount</Label>
                  <p className="font-medium">
                    ${po["D.MERCH_AMT_BSE"]?.toLocaleString() || "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ChartFields */}
          <Card>
            <CardHeader>
              <CardTitle>ChartFields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Account</Label>
                  <p className="font-medium">{po["D.ACCOUNT"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{po["D.DEPTID"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fund Code</Label>
                  <p className="font-medium">{po["D.FUND_CODE"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Class</Label>
                  <p className="font-medium">{po["D.CLASS_FLD"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Budget Reference</Label>
                  <p className="font-medium">{po["D.BUDGET_REF"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Business Unit PC</Label>
                  <p className="font-medium">{po["D.BUSINESS_UNIT_PC"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Project ID</Label>
                  <p className="font-medium">{po["D.PROJECT_ID"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Activity ID</Label>
                  <p className="font-medium">{po["D.ACTIVITY_ID"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Resource Type</Label>
                  <p className="font-medium">{po["D.RESOURCE_TYPE"]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requisition ID</Label>
                  <p className="font-medium">{po["D.REQ_ID"]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw JSON Data */}
          <Card>
            <CardHeader>
              <CardTitle>Raw JSON Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(poData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}

      {/* Vendor Details Dialog */}
      <VendorDetailsDialog
        vendorId={selectedVendorId}
        open={showVendorDialog}
        onOpenChange={setShowVendorDialog}
      />
    </div>
  );
}
