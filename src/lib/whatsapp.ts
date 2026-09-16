import { WHATSAPP_NUMERO } from "./data";
import { ItemCarritoPizza, ItemCarritoBebida, ItemCarritoCombo, Cliente } from "./store";

export function generarMensajeWhatsApp(
  cliente: Cliente | null,
  pizzas: ItemCarritoPizza[],
  bebidas: ItemCarritoBebida[],
  tipoEntrega: "delivery" | "retiro",
  domicilio: string,
  total: number,
  datosGps?: {
    lat: number;
    lng: number;
    calleAprox?: string;
    nota?: string;
  } | null,
  combos?: ItemCarritoCombo[],
  telefonoDestino?: string
): string {
  let msg = `🍕 *PEDIDO - 0600BOSTON*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  
  if (cliente) {
    msg += `👤 *Cliente:* ${cliente.nombre} ${cliente.apellido}\n`;
    msg += `📱 *Tel:* ${cliente.telefono}\n`;
  }
  
  msg += `🛵 *Modalidad:* ${tipoEntrega === "delivery" ? "Delivery a Domicilio" : "Retiro en Local"}\n`;
  if (tipoEntrega === "delivery") {
    if (datosGps) {
      msg += `📍 *Ubicación del Celular (GPS):*\n`;
      if (datosGps.calleAprox) {
        msg += `🏠 *Dirección aprox:* ${datosGps.calleAprox}\n`;
      }
      msg += `📌 *Coordenadas:* ${datosGps.lat.toFixed(6)}, ${datosGps.lng.toFixed(6)}\n`;
      msg += `🗺️ *Mapa Repartidor:* https://www.google.com/maps?q=${datosGps.lat},${datosGps.lng}\n`;
      if (datosGps.nota) {
        msg += `📝 *Aclaración / Timbre:* ${datosGps.nota}\n`;
      }
    } else {
      msg += `🏠 *Dirección de Entrega:* ${domicilio || cliente?.domicilio || "A coordinar"}\n`;
    }
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 *DETALLE DEL PEDIDO:*\n\n`;

  if (pizzas && pizzas.length > 0) {
    msg += `*🍕 PIZZAS:*\n`;
    pizzas.forEach((item, idx) => {
      const pPrecio = Number(item.precio) || 0;
      msg += `${idx + 1}. *${item.pizza?.nombre || "Pizza"}* (${item.tamaño || "8"} porciones)\n`;
      if (item.aderezos && item.aderezos.length > 0) {
        msg += `   └ Ingredientes/Aderezos: ${item.aderezos.join(", ")}\n`;
      }
      msg += `   └ Subtotal: $${pPrecio.toLocaleString("es-AR")}\n`;
    });
    msg += `\n`;
  }

  if (combos && combos.length > 0) {
    msg += `*🎁 COMBOS ESPECIALES:*\n`;
    combos.forEach((item, idx) => {
      const cant = Number(item.cantidad) || 1;
      const precioUnit = Number(item.precioUnitario || item.combo?.precio) || 0;
      const subtotal = precioUnit * cant;
      msg += `${idx + 1}. ${cant}x *${item.combo?.nombre || "Combo"}* - $${subtotal.toLocaleString("es-AR")}\n`;
      if (item.combo?.pizzaNombre && item.combo?.bebidaNombre) {
        msg += `   └ Incluye: ${item.combo.pizzaNombre} (${item.combo.pizzaTamano || 8}p) + ${item.combo.bebidaNombre}\n`;
      }
      if (item.aderezosPersonalizados && item.aderezosPersonalizados.length > 0) {
        msg += `   └ Aderezos: ${item.aderezosPersonalizados.join(", ")}\n`;
      }
    });
    msg += `\n`;
  }

  if (bebidas && bebidas.length > 0) {
    msg += `*🥤 BEBIDAS:*\n`;
    bebidas.forEach((item) => {
      const cant = Number(item.cantidad) || 1;
      const precioUnit = Number(item.precioUnitario || item.bebida?.precio) || 0;
      const subtotal = precioUnit * cant;
      msg += `• ${cant}x *${item.bebida?.nombre || "Bebida"}* - $${subtotal.toLocaleString("es-AR")}\n`;
    });
    msg += `\n`;
  }

  const numTotal = Number(total) || 0;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *TOTAL A PAGAR:* $${numTotal.toLocaleString("es-AR")}\n\n`;
  msg += `_Aguardo confirmación de demora estimada._`;

  const rawTel = (telefonoDestino || WHATSAPP_NUMERO).replace(/\D/g, "");
  const telFinal = rawTel.startsWith("549")
    ? rawTel
    : rawTel.startsWith("54")
    ? `549${rawTel.slice(2)}`
    : `549${rawTel.replace(/^0+/, "")}`;

  return `https://wa.me/${telFinal}?text=${encodeURIComponent(msg)}`;
}
