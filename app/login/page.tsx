"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid username or password");
      } else if (result?.ok) {
        toast.success("Login successful!");
        // Redirect to home - proxy.ts will redirect to role-based dashboard
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">FRED</h1>
          <p className="mt-2 text-lg text-gray-600">
            Fleet Rental Equipment Database
          </p>
          <p className="mt-1 text-sm text-gray-500">
            TxDOT Equipment Rental Management System
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                {...register("username")}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 border-t pt-6">
            <p className="text-xs text-gray-500">
              <strong>Test Credentials:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              <li>• testuser1 / password123 (ES role)</li>
              <li>• testuser2 / password123 (ES role)</li>
              <li>• rcuser1 / password123 (RC role)</li>
              <li>• finuser1 / password123 (FIN role)</li>
              <li>• manager1 / password123 (Manager role)</li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          POC Environment - Not for Production Use
        </p>
      </div>
    </div>
  );
}
