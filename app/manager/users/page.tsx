import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { EditUserDialog } from "@/components/edit-user-dialog";
import { ResetPasswordDialog } from "@/components/reset-password-dialog";

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
      <div className="space-y-6">
        {Object.entries(usersByRole).map(([role, roleUsers]) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle>{role} Users</CardTitle>
              <CardDescription>{roleUsers.length} user(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleUsers.map((user) => (
                  <div
                    key={user.usrId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium">
                        {user.firstNm} {user.lastNm}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Username: {user.usrId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Email: {user.usrEmail || "Not set"}
                      </p>
                      {user.lastUpdtDt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last updated: {new Date(user.lastUpdtDt).toLocaleDateString()} by {user.lastUpdtBy}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <EditUserDialog user={user} />
                      <ResetPasswordDialog 
                        usrId={user.usrId} 
                        userName={`${user.firstNm} ${user.lastNm}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
