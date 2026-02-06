import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { RentalForm } from "@/components/rental-form";
import { getDistricts, getNigpCodes } from "@/app/actions/rental";

export default async function RentalNewPage() {
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
      <div className="min-h-screen bg-gray-50">
        <NavBar user={session.user} />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Failed to load form data. Please try again.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <NavBar user={session.user} />
      
      <main className="container mx-auto px-4 py-2 max-w-7xl">
        <div className="mb-2">
          <h1 className="text-lg font-bold text-gray-900">Submit Rental Request</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <RentalForm 
            districts={districtsResult.data || []} 
            nigpCodes={nigpResult.data || []} 
          />
        </div>
      </main>
    </div>
  );
}
