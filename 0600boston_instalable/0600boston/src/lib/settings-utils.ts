export interface TiendaConfig {
  whatsappNumero: string; // ej: "2942661000"
  whatsappNumeroWaMe: string; // ej: "5492942661000"
  whatsappDisplay: string; // ej: "02942-661000"
  nombreLocal?: string;
  direccionLocal?: string;
  updated_at?: string;
}

export const CONFIG_DEFAULT: TiendaConfig = {
  whatsappNumero: "2942661000",
  whatsappNumeroWaMe: "5492942661000",
  whatsappDisplay: "02942-661000",
  nombreLocal: "0600Boston",
  direccionLocal: "Zapala, Neuquén",
  updated_at: new Date().toISOString(),
};

/**
 * Normaliza cualquier formato de número ingresado por el usuario (ej: "2942661000", "02942-661000", "+54 9 2942 661000")
 * y retorna:
 * - numeroLimpio: "2942661000"
 * - numeroWaMe: "5492942661000"
 * - display: "02942-661000"
 */
export function normalizarNumeroWhatsApp(input: string): {
  whatsappNumero: string;
  whatsappNumeroWaMe: string;
  whatsappDisplay: string;
} {
  // Quitar todo lo que no sea dígito
  let soloDigitos = (input || "").replace(/\D/g, "");

  if (!soloDigitos) {
    return {
      whatsappNumero: CONFIG_DEFAULT.whatsappNumero,
      whatsappNumeroWaMe: CONFIG_DEFAULT.whatsappNumeroWaMe,
      whatsappDisplay: CONFIG_DEFAULT.whatsappDisplay,
    };
  }

  // Si comienza con 549 (formato internacional de WhatsApp Argentina con prefijo celular 9)
  if (soloDigitos.startsWith("549") && soloDigitos.length >= 12) {
    const local = soloDigitos.substring(3);
    const prefijo = local.length > 6 ? local.slice(0, 4) : local.slice(0, 3);
    const sufijo = local.length > 6 ? local.slice(4) : local.slice(3);
    return {
      whatsappNumero: local,
      whatsappNumeroWaMe: soloDigitos,
      whatsappDisplay: `0${prefijo}-${sufijo}`,
    };
  }

  // Si comienza con 54 (Argentina sin 9)
  if (soloDigitos.startsWith("54") && soloDigitos.length >= 11) {
    const local = soloDigitos.substring(2);
    return normalizarNumeroWhatsApp(local);
  }

  // Si comienza con 0 (ej: 02942661000)
  if (soloDigitos.startsWith("0")) {
    soloDigitos = soloDigitos.substring(1);
  }

  // Para números argentinos de 10 dígitos (característica + número, ej: 2942661000)
  const waMe = `549${soloDigitos}`;
  const prefijo = soloDigitos.length > 6 ? soloDigitos.slice(0, 4) : soloDigitos.slice(0, 3);
  const sufijo = soloDigitos.length > 6 ? soloDigitos.slice(4) : soloDigitos.slice(3);

  return {
    whatsappNumero: soloDigitos,
    whatsappNumeroWaMe: waMe,
    whatsappDisplay: `0${prefijo}-${sufijo}`,
  };
}
