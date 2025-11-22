import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { user, account, userDetailsJegal } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSessionForUser, createIdStr } from "@/lib/auth-utils"

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, nama, id_role, nama_usaha, kontak, nik } = body;

    if (!email || !password || !nama) {
      return NextResponse.json(
        { status: false, message: "email, password, name wajib" }, { status: 400 });
    }

    // cek email
    const exists = await db.select().from(user).where(eq(user.email, email));
    if (exists.length) {
      return NextResponse.json({ status: false, message: "Email sudah terdaftar" }, { status: 409 });
    }

    const userId = createIdStr();

    // insert user
    await db.insert(user).values({
      id: userId,
      name: nama,
      email,
      role: id_role || "1",
      emailVerified: false,
    });

    // insert user details jegal
    const isVerifiedValue = String(id_role) === "1" ? "Disetujui" : "Menunggu";

    await db.insert(userDetailsJegal).values({
      id: createIdStr(),
      userId: userId,
      businessName: nama_usaha || null,
      contact: kontak || null,
      data: nik || null,
      isVerified: isVerifiedValue,
    });

    // insert account (password in account)
    await db.insert(account).values({
      id: createIdStr(),
      accountId: email,
      providerId: "email",
      userId: userId,
      password: await hashPassword(password),
    });

    // create session
    const createdSession = await createSessionForUser(userId);

    // ambil user terbaru (untuk memastikan timestamps)
    const users = await db.select().from(user).where(eq(user.id, userId));
    const createdUser = users[0];

    // format response identik Better Auth (plus session object)
    return NextResponse.json({
      status: true,
      message: 'Register successful!',
      redirect: false,
      token: createdSession.token,
      session: {
        id_user: createdSession.id,
        token: createdSession.token,
        userId: createdSession.userId,
        expiresAt: createdSession.expiresAt?.toISOString?.() ?? null,
        createdAt: createdSession.createdAt?.toISOString?.() ?? null,
        updatedAt: createdSession.updatedAt?.toISOString?.() ?? null,
        ipAddress: createdSession.ipAddress ?? null,
        userAgent: createdSession.userAgent ?? null,
      },
      data: {
        id_user: createdUser.id,
        email: createdUser.email,
        nama: createdUser.name,
        image: createdUser.image ?? null,
        emailVerified: createdUser.emailVerified ?? false,
        createdAt: createdUser.createdAt?.toISOString?.(),
        updatedAt: createdUser.updatedAt?.toISOString?.(),
      },
    }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ status: false, message: (err as Error).message || "Server error" }, { status: 500 });
  }
}
