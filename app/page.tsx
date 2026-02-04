import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Role-based home pages
const ROLE_DASHBOARDS: Record<string, string> = {
  ES: "/es/dashboard",
  RC: "/rc/dashboard",
  FIN: "/fin/dashboard",
  Manager: "/manager/dashboard",
  ADMIN: "/manager/dashboard",
  "Dist User": "/es/dashboard",
  "Data Entry": "/rc/dashboard",
};

export default async function Home() {
  const session = await auth();

  if (session) {
    const userRole = session.user.role;
    const dashboardUrl = userRole ? ROLE_DASHBOARDS[userRole] : "/es/dashboard";
    redirect(dashboardUrl);
  } else {
    redirect("/login");
  }
}
