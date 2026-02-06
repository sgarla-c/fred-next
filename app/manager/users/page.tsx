import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { UserManagementList } from "@/components/user-management-list";

export default async function ManagerUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: [
      { usrRole: "asc" },
      { firstNm: "asc" },
    ],
  });

  // Group users by role
  const usersByRole = users.reduce((acc, user) => {
    if (!acc[user.usrRole]) {
      acc[user.usrRole] = [];
    }
    acc[user.usrRole].push(user);
    return acc;
  }, {} as Record<string, typeof users>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage system users and permissions</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        {Object.entries(usersByRole).slice(0, 3).map(([role, roleUsers]) => (
          <Card key={role}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{role}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roleUsers.length}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users by Role */}
      <UserManagementList usersByRole={usersByRole} />
    </div>
  );
}
