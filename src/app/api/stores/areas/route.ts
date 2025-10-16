import { NextResponse } from "next/server";

const DUMMY_AREAS = [
  { id: "1", name: "Masjid A" },
  { id: "2", name: "Pasar C" },
  { id: "3", name: "Alun-alun" },
  { id: "4", name: "Masjid B" },
];

export async function GET() {
  return NextResponse.json({ areas: DUMMY_AREAS });
}