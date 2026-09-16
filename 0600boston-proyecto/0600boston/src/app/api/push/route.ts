import { NextResponse } from "next/server";
import webpush from "web-push";
import {
  getPushData,
  agregarNotificacionPush,
  agregarPlantillaPush,
  eliminarPlantillaPush,
  eliminarSuscripcionPush,
} from "@/lib/push-db";
import { configureWebPush } from "@/lib/vapid-server";

export async function GET() {
  try {
    const { ok: vapidConfigured } = configureWebPush();
    const data = await getPushData();
    return NextResponse.json({
      success: true,
      historial: (data.historial || []).slice(0, 3),
      plantillas: data.plantillas || [],
      totalSuscripciones: (data.suscripciones || []).length,
      suscripciones: (data.suscripciones || []).map((s) => ({
        id: s.id,
        created_at: s.created_at,
        userAgent: s.userAgent || "Navegador Web",
        clienteNombre: s.clienteNombre || null,
        clienteUsuario: s.clienteUsuario || null,
        clienteTelefono: s.clienteTelefono || null,
      })),
      vapidConfigured,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, nombre, titulo, mensaje, url, icono, destinatarios } = body;

    // Caso 1: Guardar como Plantilla
    if (action === "guardar_plantilla") {
      if (!titulo || !mensaje) {
        return NextResponse.json(
          { error: "Título y mensaje son necesarios para guardar la plantilla" },
          { status: 400 }
        );
      }
      const plantilla = await agregarPlantillaPush({
        nombre: (nombre || titulo).trim(),
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        url: url || "/menu",
        icono: icono || "🍀",
        destinatarios: destinatarios || "Todos los Clientes",
      });
      const data = await getPushData();
      return NextResponse.json({
        success: true,
        plantilla,
        plantillas: data.plantillas || [],
      });
    }

    // Caso 2: Eliminar Plantilla
    if (action === "eliminar_plantilla") {
      if (!id) {
        return NextResponse.json({ error: "ID de plantilla requerido" }, { status: 400 });
      }
      await eliminarPlantillaPush(id);
      const data = await getPushData();
      return NextResponse.json({
        success: true,
        plantillas: data.plantillas || [],
      });
    }

    // Caso 3: Emitir Notificación Push real a dispositivos
    if (!titulo || !mensaje) {
      return NextResponse.json(
        { error: "Título y mensaje son obligatorios" },
        { status: 400 }
      );
    }

    const nueva = await agregarNotificacionPush({
      titulo: titulo.trim(),
      mensaje: mensaje.trim(),
      url: url || "/menu",
      icono: icono || "🍀",
      destinatarios: destinatarios || "Todos los Clientes",
    });

    const store = await getPushData();
    const suscripciones = store.suscripciones || [];

    let alcanzados = 0;
    let fallidos = 0;
    const eliminados: string[] = [];

    const { ok: vapidConfigured, error: vapidError } = configureWebPush();

    if (!vapidConfigured) {
      console.warn("VAPID no está configurado correctamente en el entorno:", vapidError);
    } else if (suscripciones.length > 0) {
      const promesasEnvio = suscripciones.map(async (sub) => {
        // Suscripciones que no cuenten con las claves de cifrado se descartan automáticamente
        if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
          await eliminarSuscripcionPush(sub.endpoint);
          eliminados.push(sub.endpoint);
          fallidos++;
          return;
        }

        // Personalización dinámica de {nombre} por cliente
        let primerNombre = "amigo";
        if (sub.clienteNombre && sub.clienteNombre.trim()) {
          primerNombre = sub.clienteNombre.trim().split(" ")[0];
        }

        const tituloFinal = titulo
          .replace(/\{nombre\}/gi, primerNombre)
          .replace(/\[nombre\]/gi, primerNombre)
          .trim();

        const mensajeFinal = mensaje
          .replace(/\{nombre\}/gi, primerNombre)
          .replace(/\[nombre\]/gi, primerNombre)
          .trim();

        const payloadPersonalizado = JSON.stringify({
          title: tituloFinal,
          body: mensajeFinal,
          icon:
            icono && (icono.startsWith("http") || icono.startsWith("/"))
              ? icono
              : "/images/brunoagradece.webp",
          badge: "/images/brunoagradece.webp",
          url: url || "/menu",
        });

        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            },
            payloadPersonalizado,
            {
              TTL: 86400, // 24 horas en cola push si el dispositivo está apagado
              urgency: "high",
            }
          );
          alcanzados++;
        } catch (err: any) {
          fallidos++;
          // 404 o 410 señalan que la suscripción expiró o el cliente revocó permisos en su navegador
          if (err.statusCode === 404 || err.statusCode === 410) {
            await eliminarSuscripcionPush(sub.endpoint);
            eliminados.push(sub.endpoint);
          } else {
            console.error(`Error enviando web-push a ${sub.endpoint}:`, err.message || err);
          }
        }
      });

      await Promise.allSettled(promesasEnvio);
    }

    const dataFinal = await getPushData();

    return NextResponse.json({
      success: true,
      notificacion: nueva,
      alcanzados,
      fallidos,
      totalSuscripciones: (dataFinal.suscripciones || []).length,
      vapidConfigured,
      historial: (dataFinal.historial || []).slice(0, 3),
    });
  } catch (error: any) {
    console.error("Error al procesar emisión push:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
