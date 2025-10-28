import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { product, store } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateSlug } from "@/lib/api-utils";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "tourism-manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tourism manager's store
    const tourismStore = await db
      .select()
      .from(store)
      .where(eq(store.ownerId, session.user.id))
      .limit(1);

    if (tourismStore.length === 0) {
      return NextResponse.json({ tickets: [] });
    }

    const storeId = tourismStore[0].id;

    // Get all tickets for this tourism manager
    const tickets = await db
      .select()
      .from(product)
      .where(and(
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ))
      .orderBy(desc(product.createdAt));

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "tourism-manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, price, stock, image } = await request.json();

    if (!name || !price || !stock) {
      return NextResponse.json(
        { error: "Name, price, and stock are required" },
        { status: 400 }
      );
    }

    // Get or create tourism manager's store
    let tourismStore = await db
      .select()
      .from(store)
      .where(eq(store.ownerId, session.user.id))
      .limit(1);

    if (tourismStore.length === 0) {
      // Create store for tourism manager
      const storeId = nanoid();
      const storeSlug = generateSlug(`${session.user.name} Tourism`);
      
      await db.insert(store).values({
        id: storeId,
        ownerId: session.user.id,
        name: `${session.user.name} Tourism`,
        slug: storeSlug,
        description: "Tempat wisata yang dikelola",
      });

      tourismStore = [{ 
        id: storeId,
        ownerId: session.user.id,
        name: `${session.user.name} Tourism`,
        slug: storeSlug,
        areaId: null,
        description: "Tempat wisata yang dikelola",
        logo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    }

    const storeId = tourismStore[0].id;
    const productId = nanoid();
    const slug = generateSlug(name);

    // Create ticket product
    await db.insert(product).values({
      id: productId,
      storeId,
      name,
      slug,
      description,
      price: price.toString(),
      stock,
      image,
      type: "ticket",
      status: "active",
    });

    return NextResponse.json({ 
      success: true, 
      productId,
      message: "Ticket created successfully" 
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
