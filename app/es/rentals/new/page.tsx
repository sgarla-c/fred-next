import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RentalForm } from "@/components/rental-form";
import { getDistricts, getNigpCodes } from "@/app/actions/rental";

export default async function ESRentalNewPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Fetch data for the form
  const [districtsResult, nigpResult] = await Promise.all([
    getDistricts(),
    getNigpCodes(),
  ]);

  if (!districtsResult.success || !nigpResult.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load form data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Submit Rental Request</h1>
        <p className="text-gray-600 mt-2">
          Complete the form below to submit a new equipment rental request.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <RentalForm 
          districts={districtsResult.data || []} 
          nigpCodes={nigpResult.data || []} 
        />
      </div>
    </div>
  );
}
