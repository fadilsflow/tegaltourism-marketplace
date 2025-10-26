import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { product, store } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "tourism-manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticketId = params.id;

    // Get tourism manager's store
    const tourismStore = await db
      .select()
      .from(store)
      .where(eq(store.ownerId, session.user.id))
      .limit(1);

    if (tourismStore.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const storeId = tourismStore[0].id;

    // Get the specific ticket
    const tickets = await db
      .select()
      .from(product)
      .where(and(
        eq(product.id, ticketId),
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ))
      .limit(1);

    if (tickets.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = tickets[0];

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "tourism-manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticketId = params.id;
    const { name, description, price, stock, image } = await request.json();

    if (!name || !price || !stock) {
      return NextResponse.json(
        { error: "Name, price, and stock are required" },
        { status: 400 }
      );
    }

    // Get tourism manager's store
    const tourismStore = await db
      .select()
      .from(store)
      .where(eq(store.ownerId, session.user.id))
      .limit(1);

    if (tourismStore.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const storeId = tourismStore[0].id;

    // Check if ticket exists and belongs to this store
    const existingTickets = await db
      .select()
      .from(product)
      .where(and(
        eq(product.id, ticketId),
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ))
      .limit(1);

    if (existingTickets.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Update the ticket
    await db
      .update(product)
      .set({
        name,
        description,
        price: price.toString(),
        stock,
        image,
        updatedAt: new Date(),
      })
      .where(eq(product.id, ticketId));

    return NextResponse.json({ 
      success: true, 
      message: "Ticket updated successfully" 
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "tourism-manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticketId = params.id;

    // Get tourism manager's store
    const tourismStore = await db
      .select()
      .from(store)
      .where(eq(store.ownerId, session.user.id))
      .limit(1);

    if (tourismStore.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const storeId = tourismStore[0].id;

    // Check if ticket exists and belongs to this store
    const existingTickets = await db
      .select()
      .from(product)
      .where(and(
        eq(product.id, ticketId),
        eq(product.storeId, storeId),
        eq(product.type, "ticket")
      ))
      .limit(1);

    if (existingTickets.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Delete the ticket
    await db
      .delete(product)
      .where(eq(product.id, ticketId));

    return NextResponse.json({ 
      success: true, 
      message: "Ticket deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}