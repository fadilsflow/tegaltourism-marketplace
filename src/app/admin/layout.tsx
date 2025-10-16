"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { QueryProvider } from "@/components/layout/query-provider";
import { SuperAdminHeader } from "@/components/layout/admin-header";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const router = useRouter();

  // Check admin permissions
  useEffect(() => {
    const checkAdminPermission = async () => {
      if (!session?.user) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      try {
        // Check if user has admin role directly
        const isUserAdmin = session.user.role === "admin";
        setIsAdmin(isUserAdmin);
      } catch (error) {
        console.error("Error checking admin permission:", error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    if (!isPending) {
      checkAdminPermission();
    }
  }, [session, isPending]);

  // Handle authentication and admin redirect using useEffect to avoid React render errors
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    } else if (!isCheckingAdmin && session?.user && !isAdmin) {
      router.push("/");
    }
  }, [session, isPending, isAdmin, isCheckingAdmin, router]);

  // Show loading state while session is loading or checking admin status
  if (isPending || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or not admin (while redirecting)
  if (!session?.user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryProvider>
      <div className="min-h-screen bg-background">
        <SuperAdminHeader />
        <main className="flex-1">{children}</main>
      </div>
    </QueryProvider>
  );
}
