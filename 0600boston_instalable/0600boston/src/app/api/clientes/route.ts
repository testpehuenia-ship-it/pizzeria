import { NextResponse } from "next/server";
import { listarClientesDB } from "@/lib/turso";

export async function GET() {
  try {
    const clientes = await listarClientesDB();
    return NextResponse.json({ success: true, clientes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
