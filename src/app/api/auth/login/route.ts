import { NextResponse } from "next/server";
import { buscarClientePorUsuarioDB } from "@/lib/turso";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuario, password } = body;

    if (!usuario) {
      return NextResponse.json(
        { error: "Debes ingresar tu nombre de usuario" },
        { status: 400 }
      );
    }

    const cliente = await buscarClientePorUsuarioDB(usuario);
    if (!cliente) {
      return NextResponse.json(
        { error: `No se encontró ningún cliente registrado con el usuario "${usuario}". Por favor crea tu cuenta.` },
        { status: 404 }
      );
    }

    // Si tiene contraseña configurada y se envió contraseña, validamos
    if (cliente.password && password && cliente.password !== password) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        usuario: cliente.usuario,
        direccion: cliente.direccion,
        barrio: cliente.barrio,
        telefono: cliente.telefono,
      },
    });
  } catch (error: any) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: error.message || "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
