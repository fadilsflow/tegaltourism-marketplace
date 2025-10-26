"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { QueryProvider } from "@/components/layout/query-provider";
import { TourismManagerHeader } from "@/components/layout/tourism-manager-header";

export default function TourismManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const [isTourismManager, setIsTourismManager] = useState<boolean | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const router = useRouter();

  // Check tourism manager permissions
  useEffect(() => {
    const checkTourismManagerPermission = async () => {
      if (!session?.user) {
        setIsTourismManager(false);
        setIsCheckingRole(false);
        return;
      }

      try {
        const isUserTourismManager = session.user.role === "tourism-manager";
        setIsTourismManager(isUserTourismManager);
      } catch (error) {
        console.error("Error checking tourism manager permission:", error);
        setIsTourismManager(false);
      } finally {
        setIsCheckingRole(false);
      }
    };

    if (!isPending) {
      checkTourismManagerPermission();
    }
  }, [session, isPending]);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    } else if (!isCheckingRole && session?.user && !isTourismManager) {
      router.push("/");
    }
  }, [session, isPending, isTourismManager, isCheckingRole, router]);

  // Show loading state while session is loading or checking role status
  if (isPending || isCheckingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !isTourismManager) {
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
        <TourismManagerHeader />
        <main className="flex-1">{children}</main>
      </div>
    </QueryProvider>
  );
}