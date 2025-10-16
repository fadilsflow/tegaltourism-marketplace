import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
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
          user: ["list"],
        },
      },
    });

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const searchValue = searchParams.get("searchValue") || "";
    const searchField = (searchParams.get("searchField") || "name") as "name" | "email";
    const searchOperator = (searchParams.get("searchOperator") || "contains") as "contains" | "starts_with" | "ends_with";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDirection = (searchParams.get("sortDirection") || "desc") as "asc" | "desc";

    // List users using Better Auth admin plugin
    const result = await auth.api.listUsers({
      query: {
        limit,
        offset,
        searchValue,
        searchField,
        searchOperator,
        sortBy,
        sortDirection,
      },
      headers: request.headers,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
