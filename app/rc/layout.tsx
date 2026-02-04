import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Sidebar } from "@/components/sidebar";

export default async function RCLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Verify user has RC or Data Entry role
  if (session.user.role !== "RC" && session.user.role !== "Data Entry") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={session.user} />
      <div className="flex">
        <Sidebar role={session.user.role || "RC"} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
