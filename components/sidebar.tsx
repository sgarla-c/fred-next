"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  Plus,
  BarChart3,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  role: string;
}

const ROLE_NAVIGATION: Record<string, NavItem[]> = {
  ES: [
    { title: "Dashboard", href: "/es/dashboard", icon: Home },
    { title: "Submit Rental", href: "/es/rentals/new", icon: Plus },
    { title: "My Rentals", href: "/es/rentals", icon: FileText },
    { title: "Reports", href: "/es/reports", icon: BarChart3 },
  ],
  RC: [
    { title: "Dashboard", href: "/rc/dashboard", icon: Home },
    { title: "All Rentals", href: "/rc/rentals", icon: FileText },
    { title: "Purchase Orders", href: "/rc/purchase-orders", icon: FileText },
    { title: "Invoices", href: "/rc/invoices", icon: FileText },
    { title: "Reports", href: "/rc/reports", icon: BarChart3 },
  ],
  FIN: [
    { title: "Dashboard", href: "/fin/dashboard", icon: Home },
    { title: "Invoices", href: "/fin/invoices", icon: FileText },
    { title: "Receipts", href: "/fin/receipts", icon: FileText },
    { title: "Reports", href: "/fin/reports", icon: BarChart3 },
  ],
  Manager: [
    { title: "Dashboard", href: "/manager/dashboard", icon: Home },
    { title: "User Management", href: "/manager/users", icon: FileText },
    { title: "System Reports", href: "/manager/reports", icon: BarChart3 },
    { title: "Configuration", href: "/manager/config", icon: FileText },
  ],
  ADMIN: [
    { title: "Dashboard", href: "/manager/dashboard", icon: Home },
    { title: "User Management", href: "/manager/users", icon: FileText },
    { title: "System Reports", href: "/manager/reports", icon: BarChart3 },
    { title: "Configuration", href: "/manager/config", icon: FileText },
  ],
};

// Fallback navigation for roles without specific nav
ROLE_NAVIGATION["Dist User"] = ROLE_NAVIGATION.ES;
ROLE_NAVIGATION["Data Entry"] = ROLE_NAVIGATION.RC;

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.ES;

  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
