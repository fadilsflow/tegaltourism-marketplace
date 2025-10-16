// components/session?.user-button-client.tsx
"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";

export function UserButton() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-md full p-0 hover:opacity-80"
        >
          <Avatar className="h-8 w-8 rounded-md">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? ""}
                fill
              />
            ) : (
              <AvatarFallback className="rounded-lg">
                {session?.user?.name?.[0]?.toUpperCase() ?? "K"}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="p-2">
          <p className="text-sm font-medium">
            {session?.user?.name ?? "session?.user"}
          </p>
          {session?.user?.email && (
            <p className="text-xs text-muted-foreground">
              {session?.user.email}
            </p>
          )}
        </div>

        {session?.user?.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin/dashboard">Admin Dashboard</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/orders">Pesanan</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="w-full text-left flex items-center"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
