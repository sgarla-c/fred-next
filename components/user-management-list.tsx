"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditUserDialog } from "@/components/edit-user-dialog";
import { ResetPasswordDialog } from "@/components/reset-password-dialog";

interface User {
  usrId: string;
  firstNm: string;
  lastNm: string;
  usrEmail?: string | null;
  usrRole: string;
  usrPhnNbr?: string | null;
  distNbr?: number | null;
  sectId?: number | null;
  lastUpdtDt?: Date | null;
  lastUpdtBy?: string | null;
}

interface UserManagementListProps {
  usersByRole: Record<string, User[]>;
}

export function UserManagementList({ usersByRole }: UserManagementListProps) {
  return (
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
  );
}
