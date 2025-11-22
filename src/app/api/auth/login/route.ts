import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { user, account, userDetailsJegal } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSessionForUser } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const { email, password, kind } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        {
          status: false,
          message: "email & password wajib"
        },
        { status: 400 });
    }

    // cari user
    const users = await db.select().from(user).where(eq(user.email, email));
    if (!users.length) {
      return NextResponse.json(
        {
          status: false,
          message: "User tidak ditemukan"
        },
        { status: 404 });
    }
    const foundUser = users[0];

    // ambil account provider email
    const accRows = await db.select().from(account).where(eq(account.userId, foundUser.id));
    const emailAccount = accRows.find(a => a.providerId === "email");
    if (!emailAccount || !emailAccount.password) {
      return NextResponse.json(
        {
          status: false,
          message: "Akun tidak memiliki password"
        },
        { status: 400 });
    }

    const ok = await verifyPassword(password, emailAccount.password);
    if (!ok) {
      return NextResponse.json(
        {
          status: false,
          message: "Password salah"
        },
        { status: 401 });
    }

    // buat session baru
    const createdSession = await createSessionForUser(foundUser.id);

    // Default entity & kategori
    let id_entity: string | null = null;
    let id_kategori: string | null = null;
    let role: string | null = null;

    // Cek role user manggil dari JTG jika bukan role "1", biar gausah banyak nambah table di sini
    if (foundUser.role != "1") {
      const url = `${process.env.JELAJAH_TEGAL_BASE_URL}/auth/all-locations/${foundUser.id}`;
      const urlRole = `${process.env.JELAJAH_TEGAL_BASE_URL}/auth/role-string/${foundUser.role}`;

      try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.status && Array.isArray(json.data) && json.data.length > 0) {
          id_entity = json.data[0].id_entity ?? null;
          id_kategori = json.data[0].id_kategori ?? null;
        }

        const resRole = await fetch(urlRole);
        const jsonRole = await resRole.json();
        if (jsonRole.status) {
          role = jsonRole.data;
        }
      } catch {
        // Jika fetch gagal, biarkan id_entity dan id_kategori tetap null
      }
    }

    if (kind === "m" && foundUser.role === "1") {
      return NextResponse.json(
        {
          status: false,
          message: 'Login gagal: akun pengunjung tidak dapat login sebagai pengelola'
        },
        { status: 401 }
      );
    }

    // user details
    const userDetails = await db.select().from(userDetailsJegal).where(eq(userDetailsJegal.userId, foundUser.id));

    return NextResponse.json({
      redirect: false,
      token: createdSession.token,
      status: true,
      message: 'Login successful!',
      session: {
        id: createdSession.id,
        token: createdSession.token,
        id_user: createdSession.userId,
        expiresAt: createdSession.expiresAt?.toISOString?.() ?? null,
        createdAt: createdSession.createdAt?.toISOString?.() ?? null,
        updatedAt: createdSession.updatedAt?.toISOString?.() ?? null,
        ipAddress: createdSession.ipAddress ?? null,
        userAgent: createdSession.userAgent ?? null,
      },
      data: {
        id_user: foundUser.id,
        email: foundUser.email,
        nama: foundUser.name,
        nama_usaha: userDetails[0]?.businessName || null,
        kontak: userDetails[0]?.contact || null,
        is_verified: userDetails[0]?.isVerified || null,
        id_entity,
        id_kategori,
        role
      },
    }, { status: 200 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      {
        status: false,
        message: (err as Error).message || "Server error"
      },
      { status: 500 });
  }
}
