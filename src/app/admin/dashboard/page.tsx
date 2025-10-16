"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Users, Settings, BarChart3, DollarSign } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type UsersResponse = {
  users: User[];
  total: number;
};

type SystemSetting = {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
};

export default function SuperAdminDashboard() {
  // Fetch users for overview
  const { data: usersData, isLoading: usersLoading } = useQuery<UsersResponse>({
    queryKey: ["admin-users-overview"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users?limit=1000&offset=0");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  // Fetch service fee setting
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["system-settings-overview"],
    queryFn: async () => {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      return response.json();
    },
  });

  const users = usersData?.users || [];
  const settings = settingsData?.settings || [];
  const serviceFeeSetting = settings.find((s: SystemSetting) => s.key === "service_fee_percentage");

  // Calculate stats
  const totalUsers = users.length;
  const adminUsers = users.filter(user => user.role === "admin").length;
  const regularUsers = users.filter(user => user.role === "user").length;
  const serviceFeePercentage = serviceFeeSetting?.value || "5";

  if (usersLoading || settingsLoading) {
    return (
      <div className="container mx-auto py-8 px-6 md:px-12">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of system status and management tools
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users with admin privileges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regularUsers}</div>
            <p className="text-xs text-muted-foreground">
              Standard user accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceFeePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              Current service fee rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage user accounts, roles, and permissions
            </p>
            <Link href="/superadmin/manage-users">
              <Button className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Service Fee Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure system service fee percentage
            </p>
            <Link href="/superadmin/service-fee">
              <Button className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Configure Service Fee
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
