"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User } from "next-auth";

interface NavBarProps {
  user: User;
}

export function NavBar({ user }: NavBarProps) {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">FRED</h1>
              <span className="ml-2 text-sm text-gray-500">
                Fleet Rental Equipment Database
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-600">Welcome,</span>{" "}
              <span className="font-medium text-gray-900">{user.name}</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {user.role}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
