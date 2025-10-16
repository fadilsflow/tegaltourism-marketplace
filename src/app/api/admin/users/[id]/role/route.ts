import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        role: "admin",
        permissions: {
          user: ["set-role"],
        },
      },
    });

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { role } = await request.json();
    const { id } = await params;

    if (!role || !["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'user'" },
        { status: 400 }
      );
    }

    // Update user role using Better Auth admin plugin
    const result = await auth.api.setRole({
      body: {
        userId: id,
        role,
      },
      headers: request.headers,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
