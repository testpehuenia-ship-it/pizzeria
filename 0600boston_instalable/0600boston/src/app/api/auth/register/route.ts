import { NextResponse } from "next/server";
import { registrarClienteDB, buscarClientePorUsuarioDB } from "@/lib/turso";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, apellido, usuario, password, direccion, barrio, telefono } = body;

    if (!nombre || !apellido || !usuario || !direccion || !barrio || !telefono) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios: Nombre, Apellido, Usuario, Dirección, Barrio y Teléfono" },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existente = await buscarClientePorUsuarioDB(usuario);
    if (existente) {
      return NextResponse.json(
        { error: `El usuario "${usuario}" ya se encuentra registrado. Por favor inicia sesión.` },
        { status: 409 }
      );
    }

    const nuevoCliente = await registrarClienteDB({
      nombre,
      apellido,
      usuario,
      password: password || "",
      direccion,
      barrio,
      telefono,
    });

    return NextResponse.json({
      success: true,
      cliente: {
        id: nuevoCliente.id,
        nombre: nuevoCliente.nombre,
        apellido: nuevoCliente.apellido,
        usuario: nuevoCliente.usuario,
        direccion: nuevoCliente.direccion,
        barrio: nuevoCliente.barrio,
        telefono: nuevoCliente.telefono,
      },
    });
  } catch (error: any) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: error.message || "Error al registrar cliente" },
      { status: 500 }
    );
  }
}
