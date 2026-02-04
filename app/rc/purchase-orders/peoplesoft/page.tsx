"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Download, Search } from "lucide-react";
import { importPOFromPeopleSoft } from "@/app/actions/purchaseOrders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PeopleSoftPOLookupPage() {
  const router = useRouter();
  const [businessUnit, setBusinessUnit] = useState("");
  const [poId, setPoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  async function queryPeopleSoft() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch("/api/peoplesoft/query-po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessUnit, poId }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(err.error || `Request failed: ${resp.status}`);
      }
      const data = await resp.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Failed to query PeopleSoft");
    } finally {
      setLoading(false);
    }
  }

  async function importIntoFred() {
    if (!businessUnit || !poId) return;
    setImporting(true);
    setError(null);
    try {
      const res = await importPOFromPeopleSoft(businessUnit, poId);
      if (!res.success) {
        throw new Error(res.error || "Failed to import PO");
      }
      // On success, show a toast with link to the new PO
      toast.success(`PO ${res.poId ?? poId} was added to FRED.`, {
        action: {
          label: "View PO",
          onClick: () => router.push(`/rc/purchase-orders/${res.poId ?? poId}`),
        },
      });
    } catch (e: any) {
      setError(e?.message || "Failed to import PO");
    } finally {
      setImporting(false);
    }
  }

  const canImport = !!businessUnit && !!poId && !!result;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">PeopleSoft PO Lookup</h1>
        <p className="text-muted-foreground mt-2">
          Search for a PO in PeopleSoft and add it into FRED as reference data.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lookup Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Unit</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
                placeholder="e.g., TXDOT01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PO ID</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={poId}
                onChange={(e) => setPoId(e.target.value)}
                placeholder="e.g., 123456"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={queryPeopleSoft} disabled={loading || !businessUnit || !poId}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Query PeopleSoft"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>PeopleSoft Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              The raw PeopleSoft response is shown below for reference.
            </div>
            <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-[400px]">
              {JSON.stringify(result, null, 2)}
            </pre>
            <div className="flex justify-end">
              <Button onClick={importIntoFred} disabled={!canImport || importing}>
                <Download className="h-4 w-4 mr-2" />
                {importing ? "Adding..." : "Add this PO in FRED"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
