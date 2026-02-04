import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, FileText, BarChart3, Settings } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function ManagerDashboard() {
  // Fetch system statistics
  const [totalUsers, totalRentals, activeRentals, totalDistricts] = await Promise.all([
    prisma.user.count(),
    prisma.rental.count(),
    prisma.rental.count({
      where: { rentStatus: { in: ["Active", "Delivered"] } },
    }),
    prisma.district.count(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-2">System administration and management</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/manager/users">
          <Button size="lg" className="gap-2">
            <Users className="h-5 w-5" />
            Manage Users
          </Button>
        </Link>
        <Link href="/manager/reports">
          <Button variant="outline" size="lg" className="gap-2">
            <BarChart3 className="h-5 w-5" />
            View Reports
          </Button>
        </Link>
        <Link href="/manager/config">
          <Button variant="outline" size="lg" className="gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rentals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRentals}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRentals}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Districts</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistricts}</div>
            <p className="text-xs text-muted-foreground">TxDOT districts</p>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <SystemActivityList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <UserRoleBreakdown />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function SystemActivityList() {
  const recentRentals = await prisma.rental.findMany({
    include: {
      district: true,
    },
    orderBy: { submitDt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-3">
      {recentRentals.map((rental) => (
        <div key={rental.rentalId} className="text-sm">
          <p className="font-medium">
            Rental #{rental.rentalId} - {rental.rentStatus}
          </p>
          <p className="text-gray-600">
            {rental.rqstBy} | {rental.district.distNm}
          </p>
        </div>
      ))}
    </div>
  );
}

async function UserRoleBreakdown() {
  const users = await prisma.user.groupBy({
    by: ["usrRole"],
    _count: true,
  });

  return (
    <div className="space-y-3">
      {users.map((role) => (
        <div key={role.usrRole} className="flex justify-between items-center">
          <span className="font-medium">{role.usrRole}</span>
          <span className="text-gray-600">{role._count} users</span>
        </div>
      ))}
    </div>
  );
}
