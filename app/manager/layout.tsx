import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Sidebar } from "@/components/sidebar";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Verify user has Manager or ADMIN role
  if (session.user.role !== "Manager" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={session.user} />
      <div className="flex">
        <Sidebar role={session.user.role || "Manager"} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
