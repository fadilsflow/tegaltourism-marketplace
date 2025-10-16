import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ZodSchema, ZodError, ZodIssue } from "zod";

type ApiResponseData =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

type User = {
  id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
};

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Create success response
 */
export function createSuccessResponse(
  data: ApiResponseData,
  status: number = 200
) {
  return NextResponse.json(data, { status });
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { data: validatedData, error: null };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues
        .map((err: ZodIssue) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { data: null, error: errorMessage };
    }
    return { data: null, error: "Invalid request body" };
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: string } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validatedData = schema.parse(params);
    return { data: validatedData, error: null };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues
        .map((err: ZodIssue) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { data: null, error: errorMessage };
    }
    return { data: null, error: "Invalid query parameters" };
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate unique slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Handle API route with authentication
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: User) => Promise<NextResponse>
) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return createErrorResponse("Unauthorized", 401);
  }

  try {
    return await handler(request, user);
  } catch (error) {
    console.error("API Error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

/**
 * Handle API route without authentication
 */
export async function withoutAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  try {
    return await handler(request);
  } catch (error) {
    console.error("API Error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

/**
 * Calculate pagination offset
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
