import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/db/index";
import { session } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// buat token opaque aman (url-safe)
export function createSessionToken() {
  return randomBytes(24).toString("base64url"); // 32+ char url-safe
}

export function createIdStr() {
  return createId();
}

/**
 * createSession: insert session record and return session object
 * expiresInSeconds default 7 hari
 */
export async function createSessionForUser(userId: string, opts?: {
  expiresInSeconds?: number,
  ipAddress?: string | null,
  userAgent?: string | null
}) {
  const expiresIn = opts?.expiresInSeconds ?? 60 * 60 * 24 * 7; // 7 hari
  const token = createSessionToken();
  const id = createIdStr();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresIn * 1000);

  await db.insert(session).values({
    id,
    token,
    userId,
    expiresAt,
    ipAddress: opts?.ipAddress ?? null,
    userAgent: opts?.userAgent ?? null,
  });

  // ambil kembali row untuk memastikan fields createdAt/updatedAt terisi oleh DB
  const rows = await db.select().from(session).where(eq(session.id, id));
  return rows[0];
}
