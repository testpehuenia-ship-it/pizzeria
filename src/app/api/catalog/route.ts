import { NextResponse } from "next/server";
import { getCatalog, resetCatalogToDefault } from "@/lib/catalog-db";

export async function GET() {
  try {
    const catalog = await getCatalog();
    return NextResponse.json({ success: true, catalog });
  } catch (error: any) {
    console.error("Error en GET /api/catalog:", error);
    return NextResponse.json({ error: error.message || "Error al obtener catálogo" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "reset") {
      const reset = await resetCatalogToDefault();
      return NextResponse.json({ success: true, catalog: reset, message: "Catálogo restaurado a valores por defecto" });
    }
    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en POST /api/catalog:", error);
    return NextResponse.json({ error: error.message || "Error al procesar solicitud" }, { status: 500 });
  }
}
