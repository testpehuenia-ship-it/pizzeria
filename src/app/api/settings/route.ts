import { NextResponse } from "next/server";
import {
  obtenerConfiguracionTienda,
  guardarConfiguracionTienda,
} from "@/lib/settings-db";

export async function GET() {
  try {
    const settings = await obtenerConfiguracionTienda();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Error en GET /api/settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener configuración" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settings = await guardarConfiguracionTienda(body);
    return NextResponse.json({
      success: true,
      settings,
      message: "Configuración guardada correctamente en Turso y disco.",
    });
  } catch (error: any) {
    console.error("Error en POST /api/settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}
