import { NextResponse } from "next/server";
import { registrarSuscripcionPush } from "@/lib/push-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Soporta tanto objeto PushSubscription.toJSON() anidado como campos directos
    const sub = body.subscription || body;
    const { endpoint, keys } = sub;
    const userAgent =
      body.userAgent ||
      (request.headers.get("user-agent") ?? undefined);

    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json(
        { error: "Endpoint de suscripción requerido" },
        { status: 400 }
      );
    }

    if (!keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: "Claves criptográficas p256dh y auth son requeridas para Web Push" },
        { status: 400 }
      );
    }

    const clienteNombre = body.clienteNombre || sub.clienteNombre;
    const clienteUsuario = body.clienteUsuario || sub.clienteUsuario;
    const clienteTelefono = body.clienteTelefono || sub.clienteTelefono;

    await registrarSuscripcionPush(
      {
        endpoint,
        keys: {
          p256dh: String(keys.p256dh),
          auth: String(keys.auth),
        },
      },
      userAgent,
      {
        nombre: clienteNombre,
        usuario: clienteUsuario,
        telefono: clienteTelefono,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Dispositivo registrado con éxito para notificaciones Web Push",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
