"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getVendors,
  getAllowedNextStatuses,
  getPOTypes,
  getStatusWorkflowInfo,
  type CreatePOData,
} from "@/app/actions/purchaseOrders";
import { AlertCircle, Info } from "lucide-react";

interface PurchaseOrder extends CreatePOData {
  poId?: number;
}

interface POFormProps {
  purchaseOrder?: PurchaseOrder;
  isEditing?: boolean;
}

export function POForm({ purchaseOrder, isEditing = false }: POFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<string[]>([]);
  const [allowedStatuses, setAllowedStatuses] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [statusInfo, setStatusInfo] = useState<{
    allowedTransitions: string[];
    isTerminal: boolean;
    nextSteps: string[];
  } | null>(null);

  const [formData, setFormData] = useState<PurchaseOrder>({
    poRlseNbr: purchaseOrder?.poRlseNbr || "",
    poRcvdBy: purchaseOrder?.poRcvdBy || "",
    vendrNm: purchaseOrder?.vendrNm || "",
    userRqstViaPurchFlg: purchaseOrder?.userRqstViaPurchFlg || false,
    poBuNbr: purchaseOrder?.poBuNbr || "",
    eRqstnNbr: purchaseOrder?.eRqstnNbr || "",
    poStatus: purchaseOrder?.poStatus || "Draft",
    poStartDt: purchaseOrder?.poStartDt || undefined,
    poExpirDt: purchaseOrder?.poExpirDt || undefined,
    txdotGps: purchaseOrder?.txdotGps || false,
    mnthEqRate: purchaseOrder?.mnthEqRate || undefined,
    poType: purchaseOrder?.poType || "",
    spclEvnt: purchaseOrder?.spclEvnt || "",
    chartFieldsFlg: purchaseOrder?.chartFieldsFlg || false,
    vendorMail: purchaseOrder?.vendorMail || "",
    vendorPhnNbr: purchaseOrder?.vendorPhnNbr || "",
  });

  useEffect(() => {
    async function loadOptions() {
      const [vendorList, statusList, typeList] = await Promise.all([
        getVendors(),
        getAllowedNextStatuses(purchaseOrder?.poId, purchaseOrder?.poStatus),
        getPOTypes(),
      ]);
      setVendors(vendorList.map((v) => v.vendrNm || "").filter(Boolean));
      setAllowedStatuses(statusList);
      setTypes(typeList);
      setStatusInfo(getStatusWorkflowInfo(purchaseOrder?.poStatus));
    }
    loadOptions();
  }, [purchaseOrder?.poId, purchaseOrder?.poStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = isEditing && purchaseOrder?.poId
        ? await updatePurchaseOrder({
            ...formData,
            poId: purchaseOrder.poId,
          })
        : await createPurchaseOrder(formData);

      if (result.success) {
        router.push("/rc/purchase-orders");
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else if (type === "date") {
      setFormData((prev) => ({ ...prev, [name]: value ? new Date(value) : undefined }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {statusInfo && statusInfo.isTerminal && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded flex items-start gap-2">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Terminal Status:</strong> This PO is in a {formData.poStatus} state and cannot be changed to another status.
          </div>
        </div>
      )}

      {statusInfo && statusInfo.nextSteps.length > 0 && !statusInfo.isTerminal && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Workflow Guidance:</strong>
              <ul className="mt-1 ml-4 list-disc text-sm">
                {statusInfo.nextSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                PO Release Number
              </label>
              <input
                type="text"
                name="poRlseNbr"
                value={formData.poRlseNbr || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter PO release number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="poStatus"
                value={formData.poStatus || "Draft"}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
                disabled={statusInfo?.isTerminal}
              >
                {allowedStatuses.length > 0 ? (
                  allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Draft">Draft</option>
                    <option value="Open">Open</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                PO Type
              </label>
              <select
                name="poType"
                value={formData.poType || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Type</option>
                {types.length > 0 ? (
                  types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Standard">Standard</option>
                    <option value="Fleet">Fleet</option>
                    <option value="Call-Off">Call-Off</option>
                    <option value="Emergency">Emergency</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Received By
              </label>
              <input
                type="text"
                name="poRcvdBy"
                value={formData.poRcvdBy || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="poStartDt"
                value={
                  formData.poStartDt
                    ? new Date(formData.poStartDt).toISOString().split("T")[0]
                    : ""
                }
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                name="poExpirDt"
                value={
                  formData.poExpirDt
                    ? new Date(formData.poExpirDt).toISOString().split("T")[0]
                    : ""
                }
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Monthly Equipment Rate ($)
              </label>
              <input
                type="number"
                name="mnthEqRate"
                value={formData.mnthEqRate || ""}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full border rounded px-3 py-2"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Business Unit Number
              </label>
              <input
                type="text"
                name="poBuNbr"
                value={formData.poBuNbr || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter BU number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                E-Requisition Number
              </label>
              <input
                type="text"
                name="eRqstnNbr"
                value={formData.eRqstnNbr || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter e-requisition number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Special Event
              </label>
              <input
                type="text"
                name="spclEvnt"
                value={formData.spclEvnt || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter special event name"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="txdotGps"
                checked={formData.txdotGps || false}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium">TxDOT GPS</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="chartFieldsFlg"
                checked={formData.chartFieldsFlg || false}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium">Chart Fields Required</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="userRqstViaPurchFlg"
                checked={formData.userRqstViaPurchFlg || false}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium">User Request via Purchase</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                name="vendrNm"
                value={formData.vendrNm || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter vendor name"
                list="vendors"
              />
              <datalist id="vendors">
                {vendors.map((vendor) => (
                  <option key={vendor} value={vendor} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Vendor Email
              </label>
              <input
                type="email"
                name="vendorMail"
                value={formData.vendorMail || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="vendor@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Vendor Phone
              </label>
              <input
                type="tel"
                name="vendorPhnNbr"
                value={formData.vendorPhnNbr || ""}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="(555) 555-5555"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update PO" : "Create PO"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
