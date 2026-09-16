import webpush from "web-push";
import { DEFAULT_VAPID_PUBLIC_KEY, getVapidPublicKey } from "./vapid-keys";

export const DEFAULT_VAPID_PRIVATE_KEY =
  "L_lMB8AfbkHxRn-ACAqQJ9ilqH6SdsP6YxpUdx4BZjE";

export const DEFAULT_VAPID_SUBJECT =
  "mailto:soporte@0600boston.com";

export function getVapidPrivateKey(): string {
  const env = process.env.VAPID_PRIVATE_KEY;
  if (env && typeof env === "string" && env.trim().length > 10 && !env.includes("undefined")) {
    return env.trim().replace(/^["']|["']$/g, "");
  }
  return DEFAULT_VAPID_PRIVATE_KEY;
}

export function getVapidSubject(): string {
  let sub = process.env.VAPID_SUBJECT;
  if (!sub || typeof sub !== "string" || sub.trim().length < 5 || sub.trim() === "mailto=" || sub.includes("undefined")) {
    return DEFAULT_VAPID_SUBJECT;
  }
  sub = sub.trim().replace(/^["']|["']$/g, "");
  if (!sub.startsWith("mailto:") && !sub.startsWith("http://") && !sub.startsWith("https://")) {
    if (sub.includes("@")) {
      sub = `mailto:${sub}`;
    } else {
      return DEFAULT_VAPID_SUBJECT;
    }
  }
  // Verificar si quedó "mailto:" sin email o con sintaxis rota
  if (sub === "mailto:" || sub === "mailto=@" || (!sub.includes("@") && !sub.startsWith("http"))) {
    return DEFAULT_VAPID_SUBJECT;
  }
  return sub;
}

/**
 * Configura la librería web-push de manera resiliente.
 * Si las variables de entorno fallan o tienen un formato erróneo (como mailto= sin email),
 * se recupera automáticamente usando las credenciales predeterminadas verificadas del proyecto.
 */
export function configureWebPush(): { ok: boolean; subject: string; error?: string } {
  const pub = getVapidPublicKey();
  const priv = getVapidPrivateKey();
  const subj = getVapidSubject();

  try {
    webpush.setVapidDetails(subj, pub, priv);
    return { ok: true, subject: subj };
  } catch (err: any) {
    console.warn("Advertencia: No se pudo configurar VAPID con variables del entorno, usando valores predeterminados seguros:", err?.message);
    try {
      webpush.setVapidDetails(DEFAULT_VAPID_SUBJECT, DEFAULT_VAPID_PUBLIC_KEY, DEFAULT_VAPID_PRIVATE_KEY);
      return { ok: true, subject: DEFAULT_VAPID_SUBJECT };
    } catch (err2: any) {
      console.error("Fallo crítico en webpush.setVapidDetails:", err2?.message);
      return { ok: false, subject: DEFAULT_VAPID_SUBJECT, error: err2?.message };
    }
  }
}
