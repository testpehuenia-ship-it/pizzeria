// Claves y utilidades VAPID accesibles tanto desde el cliente (navegador) como desde el servidor

export const DEFAULT_VAPID_PUBLIC_KEY =
  "BN7tSmYOVn5xpS62Oh6BXj108jgjpm3_dqUTEtNroFd9M3ta4g7mvi8poYPuujFIvhHpT2F71A_yEFmqlWD5tAQ";

/**
 * Obtiene la clave pública VAPID limpia y validada.
 * Si no está configurada en process.env, retorna la clave por defecto del proyecto.
 */
export function getVapidPublicKey(): string {
  const envKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (envKey && typeof envKey === "string" && envKey.trim().length > 20 && !envKey.includes("undefined")) {
    return envKey.trim().replace(/^["']|["']$/g, "");
  }
  return DEFAULT_VAPID_PUBLIC_KEY;
}

/**
 * Convierte una clave VAPID en formato base64 URL-safe a Uint8Array
 * para que el navegador la use en reg.pushManager.subscribe
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
