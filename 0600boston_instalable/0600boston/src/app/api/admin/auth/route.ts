import { NextResponse } from "next/server";
import { autenticarAdmin } from "@/lib/admin-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuario = "admin", password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Debe ingresar una contraseña." },
        { status: 400 }
      );
    }

    const user = await autenticarAdmin(usuario, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      message: `Bienvenido, ${user.nombre}!`,
    });
  } catch (error: any) {
    console.error("Error en POST /api/admin/auth:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al autenticar." },
      { status: 500 }
    );
  }
}
