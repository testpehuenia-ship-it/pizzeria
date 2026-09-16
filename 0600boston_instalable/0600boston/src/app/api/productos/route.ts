import { NextResponse } from "next/server";
import { crearProductoDB, listarProductosDB } from "@/lib/turso";

export async function GET() {
  try {
    const productos = await listarProductosDB();
    return NextResponse.json({ success: true, productos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio4, precio8, categoria, imagen_url } = body;

    if (!nombre || !precio8) {
      return NextResponse.json(
        { error: "Nombre y precio son obligatorios" },
        { status: 400 }
      );
    }

    const nuevo = await crearProductoDB({
      nombre,
      descripcion: descripcion || "",
      precio4: Number(precio4) || 0,
      precio8: Number(precio8) || 0,
      categoria: categoria || "pizza",
      imagen_url: imagen_url || "",
    });

    return NextResponse.json({ success: true, producto: nuevo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
