import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Sidebar } from "@/components/sidebar";

export default async function ESLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Verify user has ES or Dist User role
  if (session.user.role !== "ES" && session.user.role !== "Dist User") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={session.user} />
      <div className="flex">
        <Sidebar role={session.user.role || "ES"} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
